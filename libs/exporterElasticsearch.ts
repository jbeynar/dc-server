'use strict';

import * as Rx from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as pg from 'pg';
import * as db from './db';
import * as http from 'http-as-promised';
import {TaskExportElasticsearch} from "../shared/typings";
import {log} from "./logger";

function esHttpCall(esUrl, indexName, method?, body?) {
    return http({
        uri: `${esUrl}/${indexName}`,
        method: method || 'GET',
        json: body
    });
}

export function createJsonDocumentsObservable(type: string): Rx.Observable<any> {
    const query = `SELECT body FROM document_json WHERE type = '${type}'`;

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

export function createMapping(esUrl, indexName: string, mapping: any, overwrite: boolean) {
    return esHttpCall(esUrl, indexName, 'PUT', {mappings: mapping}).spread((result) => {
        if ([200, 201].indexOf(result.statusCode) > -1) {
            console.log(`Created elasticsearch index ${indexName}`);
        } else {
            throw new Error(`Can not create index ${indexName}. HTTP status code ${result.statusCode}`);
        }
    }).catch((error) => {
        const errorType = _.get(error, 'body.error.type');
        if (overwrite && 'index_already_exists_exception' === errorType) {
            console.log('Index already exists but will recreate');
            return esHttpCall(esUrl, indexName, 'DELETE').spread((result) => {
                if (200 == result.statusCode) {
                    return createMapping(esUrl, indexName, mapping, false);
                } else {
                    throw new Error(`Can not delete index ${indexName}. HTTP status code ${result.statusCode}`);
                }
            });
        }
        const e = errorType ? `Can not create index ${indexName} due to ${errorType}` : error;
        throw new Error(e);
    });
}

export function bulkSaveEs(esUrl, indexName, bulk) {
    const body = _.reduce(bulk, (acc, item) => {
            acc.push(JSON.stringify({index: {_index: indexName, _type: indexName}}));
            acc.push(JSON.stringify(item));
            return acc;
        }, []).join('\n') + '\n';

    return http({uri: `${esUrl}/${indexName}/_bulk`, method: 'POST', body}).spread((result, body) => {
        const response = JSON.parse(body);
        if (response.errors) {
            const error = _.get(response, 'items[0].index.error.reason', '') || 'Can not perform ES bulk';
            throw new Error(error);
        }
        let i = 0;
        _.forEach(response.items, (item) => {
            if (201 === item.index.status) {
                i++;
            }
        });
        return i;
    });
}

export function exportIntoElasticsearch(exportTask: TaskExportElasticsearch) {
    return createMapping(exportTask.target.url, exportTask.target.indexName, exportTask.target.mapping, true).then(() => {
        return new Promise((resolve, reject) => {
            const source: Rx.Observable<any> = createJsonDocumentsObservable(exportTask.sourceJsonDocuments.typeName);
            const concurrencyCount = 10;
            return source
                .flatMap(exportTask.transform)
                .bufferCount(exportTask.target.bulkSize)
                .flatMap((buffer) => {
                    return bulkSaveEs(exportTask.target.url, exportTask.target.indexName, buffer);
                }, concurrencyCount)
                .subscribe((item) => {
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
