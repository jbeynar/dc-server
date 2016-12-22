'use strict';

import * as pg from 'pg';
import * as Rx from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import * as db from './db';
import {useFlavour} from 'squel';
import {removeJsonDocuments, saveJsonDocument} from './repo';
import * as logger from './logger';
import {TaskExtract} from "../shared/typings";
import {progressNotification} from "./sockets";
import {config} from "../config";

const squel = useFlavour('postgres');

export const errorCodes = {
    documentMalformedStructure: 'ERR_DOCUMENT_MALFORMED_STRUCTURE',
    documentBodyEmpty: 'ERR_DOCUMENT_BODY_EMPTY',
    taskMalformedStructure: 'ERR_TASK_MALFORMED_STRUCTURE'
};

export function extract(document, extractionTask, whitelist?)
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
        if (_.isEmpty(extractionTask)) {
            return reject(new Error(errorCodes.taskMalformedStructure));
        }

        $ = cheerio.load(document.body);

        if (extractionTask.scope) {
            resolve(_.map($(extractionTask.scope), scope => extractAll($(scope), extractionTask.map)));
        } else {
            resolve(extractAll($('html'), extractionTask.map));
        }
    }).then((extracted) =>
    {
        return _.isFunction(extractionTask.process) ? extractionTask.process(extracted, document) : extracted;
    });
}

export function extractFromRepo(extractionTask : TaskExtract)
{
    return new Promise((resolve)=>
    {
        if (extractionTask.targetJsonDocuments.autoRemove) {
            return removeJsonDocuments(extractionTask.targetJsonDocuments.typeName).then(resolve);
        }
        resolve();
    }).then(() =>
    {
        const pool = db.getPool(), concurrencyCount = Math.max(1, config.db.poolConfig.max - 5);
        let i = 0, total = 10000, progress = 0;

        function createRepoHttpObservable(conditions: any): Rx.Observable<any> {

            const query = squel.select().from(config.db.schema + '.document_http');
            _.each(conditions, (value, field) => {
                query.where(field + (_.isString(value) ? ' LIKE ?' : ' = ?'), value);
            });
            const countQuery = query.clone().field('COUNT(id)', 'count');

            return Rx.Observable.create((subscriber) => {
                pool.connect().then((client: pg.Client) => {
                    client.query(countQuery.toParam()).then((result) => {
                        total = _.get(result, 'rows[0].count', total);
                        logger.log(`Extracting ${total} rows...`, 1);
                    });

                    const stream: pg.Query = client.query(query.toParam(), () => {
                    });

                    stream.on('row', (row) => {
                        subscriber.next(row);
                    });

                    stream.on('end', () => {
                        subscriber.complete();
                        client.release();
                    });
                });
            });
        }

        var source: Rx.Observable<any> = createRepoHttpObservable(extractionTask.sourceHttpDocuments).flatMap((row) => {
            return extract(row, extractionTask).then((document): Promise<any> => {
                delete row.body;

                if (_.isEmpty(document)) {
                    return Promise.resolve();
                }

                if (_.isArray(document)) {
                    return Promise.map(document, (doc) => {
                        i++;
                        return saveJsonDocument(extractionTask.targetJsonDocuments.typeName, doc);
                    });
                }
                i++;
                return saveJsonDocument(extractionTask.targetJsonDocuments.typeName, document);
            });
        }, concurrencyCount).bufferCount(20).map(() => {
            progress = i / total;
            progressNotification('terminal', extractionTask.type, extractionTask.targetJsonDocuments.typeName, progress);
        });

        return new Promise((resolve) => {
            source.subscribe(() => {
                // on next
            }, (err) => {
                console.log('Error on rx chain');
                console.log(err && err.stack);
            }, () => {
                logger.log(`Saved ${i} JSON documents`, 1);
                resolve();
            });
        });

    });
}
