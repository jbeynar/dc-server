'use strict';

import * as Rx from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as pg from 'pg';
import * as db from './db';
import * as http from 'http-as-promised';
import {IDocumentJson, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig} from "../shared/typings";
import {log} from "./logger";
import {Curl} from 'node-libcurl';

function esHttpCall(esUrl, indexName, method?, body?) {
    return http({
        uri: `${esUrl}/${indexName}`,
        method: method || 'GET',
        json: body
    });
}

export function createJsonDocumentsObservable(type: string): Rx.Observable<any> {
    const query = `SELECT body, ts FROM document_json WHERE type = '${type}'`;

    return Rx.Observable.create((subscriber) => {
        return db.getClient().then((client: pg.Client) => {
            const stream: pg.Query = client.query(query, (err) => {
                if (err) {
                    console.error(err);
                    throw err;
                }
            });

            stream.on('row', (row) => {
                subscriber.next(row);
            });

            stream.on('end', () => {
                client.release();
                subscriber.complete();
            });
        });
    });
}

export function createMapping(config: TaskExportElasticsearchTargetConfig) {

    return esHttpCall(config.url, config.indexName, 'PUT', {mappings: config.mapping}).spread((result) => {
        if ([200, 201].indexOf(result.statusCode) > -1) {
            log(`Created elasticsearch index ${config.indexName}`, 1);
        } else {
            throw new Error(`Can not create index ${config.indexName}. HTTP status code ${result.statusCode}`);
        }
    }).catch((error) => {
        const errorType = _.get(error, 'body.error.type');
        if (config.overwrite && 'index_already_exists_exception' === errorType) {
            log(`Index "${config.indexName}" already exists but will recreate`, 1);
            return esHttpCall(config.url, config.indexName, 'DELETE').spread((result) => {
                if (200 == result.statusCode) {
                    config.overwrite = false;
                    log(`Eventually creating mapping for ${config.indexName}`, 1);
                    return createMapping(config);
                } else {
                    throw new Error(`Can not delete index ${config.indexName}. HTTP status code ${result.statusCode}`);
                }
            });
        }
        console.error('Mapping creation exception');
        console.error(error);
        const e = errorType ? `Can not create index ${config.indexName} due to ${errorType}` : error;
        throw new Error(error);
    });
}

export function bulkSaveEs(esUrl, indexName, bulk): Promise<any> {
    const body = _.reduce(bulk, (acc, item) => {
            if (!item) {
                return acc;
            }
            acc.push(JSON.stringify({index: {_index: indexName, _type: indexName}}));
            acc.push(JSON.stringify(item));
            return acc;
        }, []).join('\n') + '\n';

    if (body.length <= 1) {
        return Promise.resolve(0);
    }

    return new Promise((resolve) => {
        const query = {
            error: true,
            uri: `${esUrl}/${indexName}/_bulk`,
            method: 'POST',
            body
        };

        http(query).spread((result, body) => {
            const response = JSON.parse(body);
            if (response.errors) {
                console.error('ES bulk insert failed on some documents');
            }
            let success = 0, failure = 0;
            _.forEach(response.items, (item, index: number) => {
                if (201 === item.index.status) {
                    success++;
                } else {
                    failure++;
                    console.log('Document source:');
                    console.log(bulk[index]);
                    console.log('Error details:');
                    console.error(item.index);
                }
            });
            resolve(success)
        });
    });
}

export function stream(exportTask: TaskExportElasticsearch, stream: Rx.Observable<IDocumentJson>): Promise<Rx.Observable<IDocumentJson>> {
    return createMapping(exportTask.target).then(() => {
        const concurrencyCount = 2;
        return stream
            .flatMap(exportTask.transform)
            .bufferCount(exportTask.target.bulkSize)
            .flatMap((buffer) => {
                return bulkSaveEs(exportTask.target.url, exportTask.target.indexName, buffer);
            }, concurrencyCount);
    });
}

export function exportFromRepoIntoElasticsearch(exportTask: TaskExportElasticsearch) {
    return new Promise((resolve, reject) => {
        return stream(exportTask, createJsonDocumentsObservable(exportTask.sourceJsonDocuments.typeName)).then((observable) => {
            observable.subscribe((item) => {
                log('.');
            }, (err) => {
                console.error('Error while exporting to ES');
                reject(err);
            }, () => {
                log(' [OK]', 1);
                resolve();
            });
        });
    });
}
