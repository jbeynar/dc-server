'use strict';

import * as pg from 'pg';
import * as Cursor from 'pg-cursor';
import * as Rx from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import * as db from './db';
import {useFlavour} from 'squel';
import {removeJsonDocuments, saveJsonDocument} from './repo';
import * as logger from './logger';
import {IDocumentHttp, IDocumentJson, TaskExtract} from "../shared/typings";
import {config} from "../config";
import * as esExporter from "./exporterElasticsearch";

const squel = useFlavour('postgres');

export const errorCodes = {
    documentMalformedStructure: 'ERR_DOCUMENT_MALFORMED_STRUCTURE',
    documentBodyEmpty: 'ERR_DOCUMENT_BODY_EMPTY',
};

export function extract(document: IDocumentHttp, extractionTask: TaskExtract, whitelist?)
{
    return new Promise((resolve, reject) =>
    {
        let $;

        function extractOnce($scope, def, key)
        {
            if (_.isArray(whitelist) && !_.includes(whitelist, key)) {
                return null;
            }

            const selector = _.isString(def) ? def : def.selector;
            const elements = $scope.find(selector);

            const res = _.map(elements, (element : any) =>
            {
                element = $(element);
                let value = def.attribute ? element.attr(def.attribute) : element.text();

                if (_.isFunction(def.process)) {
                    try {
                        value = def.process(value, element);
                    } catch (err) {
                        logger.error('Process function fails at `' + key + '` cause:', err);
                    }
                } else if (_.isString(def.process) && _.isString(value)) {
                    try {
                        value = _.head(value.match(new RegExp(def.process)));
                    } catch (err) {
                        logger.error('Process regular expression string fails at `' + key, '` cause:', err);
                    }
                } else if (_.isRegExp(def.process) && _.isString(value)) {
                    try {
                        value = _.head(value.match(def.process));
                    } catch (err) {
                        logger.error('Process regular expression fails at `' + key, '` cause:', err);
                    }
                }

                return value;
            });

            return def.singular ? _.first(res) : res;
        }

        function extractAll($scope, map)
        {
            const extracted = _.chain(map).keys().zipObject().value() || {};
            _.forEach(map, (def, key) =>
            {
                let extractedValue = extractOnce($scope, def, key);
                extracted[key] = extractedValue != null ? extractedValue : def.default;
            });

            return extracted;
        }

        if (!_.isObject(document) || _.isEmpty(document)) {
            return reject(new Error(errorCodes.documentMalformedStructure));
        }
        if (_.isEmpty(document.body)) {
            return reject(new Error(errorCodes.documentBodyEmpty));
        }

        if (_.isEmpty(extractionTask.map)) {
            try {
                resolve(JSON.parse(document.body));
            } catch (err) {
                logger.error('Extractor was trying to save raw json cause map was not specified');
                logger.error(err);
                reject(err);
            }
        } else {
            $ = cheerio.load(document.body);

            if (extractionTask.scope) {
                resolve(_.map($(extractionTask.scope), scope => extractAll($(scope), extractionTask.map)));
            } else {
                resolve(extractAll($('html'), extractionTask.map));
            }
        }
    }).then((extracted) =>
    {
        return _.isFunction(extractionTask.process) ? extractionTask.process(extracted, document) : extracted;
    });
}

function saveToRepo(typeName, documentOrBulk): Promise<any> {
    let i = 0;
    if (_.isEmpty(documentOrBulk)) {
        return Promise.resolve(i);
    }

    if (_.isArray(documentOrBulk)) {
        return Promise.map(documentOrBulk, (doc: IDocumentJson) => {
            return saveJsonDocument(typeName, doc).then(() => {
                i++;
                doc = null;
            });
        }).then(() => i);
    }
    return saveJsonDocument(typeName, documentOrBulk).then(() => {
        i++;
        documentOrBulk = null;
        return i;
    });
}

export function extractFromRepo(extractionTask : TaskExtract)
{
    let i = 0;
    const readBulkSize = 50;

    function createExtractionObservable(conditions): Rx.Observable<IDocumentHttp[]> {
        let cursor, readHandler;
        return Rx.Observable.create((subscriber) => {
            db.getClient().then((client: pg.Client) => {

                const query = squel.select().from(`${config.db.schema}.document_http`);
                _.each(conditions, (value, field) => {
                    query.where(field + (_.isString(value) ? ' LIKE ?' : ' = ?'), value);
                });

                cursor = client.query(new Cursor(query.toString()));

                readHandler = function (err, rowsBulk) {
                    if (err) {
                        logger.log('unexpected cursor exception');
                        logger.log(err);
                        subscriber.error(err);
                        return client.release();
                    }

                    if (!rowsBulk.length) {
                        subscriber.complete();
                        return client.release();
                    }
                    subscriber.next(rowsBulk);
                };

                cursor.read(readBulkSize, readHandler); // initial call
            });
        }).flatMap((bulk) => {
            return Promise.map(bulk, (document: IDocumentHttp) => {
                return extract(document, extractionTask).then((data) => {
                    document = null;
                    return data;
                });
            }).then((dataSet) => {
                cursor.read(readBulkSize, readHandler); // backpressure
                return dataSet;
            });
        });
    }

    let observable: Rx.Observable<any> = createExtractionObservable(extractionTask.sourceHttpDocuments);
    let targetInitPromise:Promise<any> = Promise.resolve();

    if (extractionTask.exportJsonDocuments) { // export to elasticsearch
        targetInitPromise = esExporter.createMapping(extractionTask.exportJsonDocuments.target);
        observable = observable.flatMap((bulk) => {
            return Promise.map(bulk, extractionTask.exportJsonDocuments.transform).then((transformatedBulk) => {
                return esExporter.bulkSaveEs(
                    extractionTask.exportJsonDocuments.target.url,
                    extractionTask.exportJsonDocuments.target.indexName,
                    transformatedBulk
                );
            });
        });
    } else if (extractionTask.targetJsonDocuments) { // save to local postgresql
        targetInitPromise = _.get(extractionTask, 'targetJsonDocuments.autoRemove') ?
            removeJsonDocuments(extractionTask.targetJsonDocuments.typeName) :
            Promise.resolve();

        observable = observable.flatMap((bulk) => {
            return Promise.map(bulk, (document) => {
                return saveToRepo(extractionTask.targetJsonDocuments.typeName, document).then((count) => {
                    i += count;
                });
            }, {concurrency: 10});
        }, 1);
    }else{
        throw new Error('Unsupported export target type');
    }

    return targetInitPromise.then(() => {
        return new Promise((resolve, reject) => {
            observable.subscribe(() => {
                },
                (err) => {
                    logger.log('Error on rx chain');
                    logger.log(err && err.stack);
                    reject();
                }, () => {
                    logger.log(`Saved ${i} JSON documents`, 1);
                    resolve();
                });
        });
    });
}
