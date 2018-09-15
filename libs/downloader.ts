'use strict';

import * as _ from 'lodash';
import * as repo from './repo';
import * as Promise from 'bluebird';
import * as urlInfoService from 'url';
import * as http from 'http-as-promised';
import {log} from "./logger";
import {IDocumentHttp, TaskDownload} from "../shared/typings";
import * as querystring from 'querystring';

const defaultOptions = {
    intervalTime: 600,
    httpTimeoutMs: 30000
};

export function downloadHttpDocuments(downloadTask: TaskDownload): Promise<any> {
    const options = defaultOptions;

    function autoRemoveSeries(): Promise<any> {
        if (downloadTask.autoRemove) {
            log(`Removing all http documents with name ${downloadTask.name}`, 1);
            return repo.removeHttpDocumentsByName(downloadTask.name);
        } else {
            return Promise.resolve();
        }
    }

    function downloadSeries() {
        return Promise.resolve(downloadTask.urls()).then((urls) => {
            let i = 0;
            const failedItems = [];
            return Promise.mapSeries(urls, function (target: string | any) {
                let url;
                let payload = '';
                if (_.isObject(target)) {
                    url = _.get(target, 'url');
                    delete target.url;
                    if (_.has(target, 'body')) {
                        payload = querystring.stringify(_.get(target, 'body'));
                    }
                } else {
                    url = target;
                }
                if (!_.isString(url)) {
                    console.error(url);
                    throw new Error(`URL must be string, but ${typeof url} was given`);
                }
                log(`${++i}/${urls.length} ${url + payload}`);
                return repo.isDocumentExists(url + payload)
                    .then(() => log(' [SKIP]', 1))
                    .catch(() => {
                        return new Promise((resolve) => {
                            const requestConfig: any = {
                                uri: url,
                                method: 'GET',
                                timeout: defaultOptions.httpTimeoutMs
                            };
                            if (!_.isEmpty(payload)) {
                                requestConfig.formData = payload;
                            }
                            if (_.get(downloadTask, 'options.headers') && !_.isEmpty(downloadTask.options.headers)) {
                                requestConfig.headers = downloadTask.options.headers;
                            }
                            return http(requestConfig).spread((response, body) => {
                                let urlInfo = urlInfoService.parse(url);
                                let documentHttp: IDocumentHttp = {
                                    type: response['content-type'],
                                    name: downloadTask.name,
                                    url: url + payload,
                                    host: urlInfo.hostname,
                                    path: urlInfo.pathname,
                                    query: urlInfo.query,
                                    code: response.statusCode,
                                    headers: (<any>JSON).stringify(response.headers),
                                    body: body,
                                    length: body.length
                                };
                                if (_.isObject(target)) {
                                    documentHttp.metadata = (<any>JSON).stringify(target);
                                }
                                log(` ${parseInt(body.length).toLocaleString()} b [${documentHttp.code}]`, 1);
                                if (200 !== documentHttp.code) {
                                    failedItems.push({url: url, code: documentHttp.code});
                                }
                                return repo.saveHttpDocument(documentHttp).then(resolve);
                            }).catch(error => {
                                log(`Downloader error: ${error.statusCode} on url ${url}`, 1);
                                console.log(JSON.stringify(error, null, 2));
                                failedItems.push({url: url, error: error});
                                resolve();
                            });
                        }).delay(options.intervalTime);
                    });
            }).then(() => {
                if (!_.isEmpty(failedItems)) {
                    console.log('Fail on some URLs');
                    _.forEach(failedItems, (item) => {
                        console.log(item.url, item.code || item.error);
                    });
                } else {
                    console.log('All URLs downloaded successfully');
                }
            });
        });
    }

    return autoRemoveSeries().then(downloadSeries);
}
