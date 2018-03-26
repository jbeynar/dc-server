'use strict';

import * as _ from 'lodash';
import * as repo from './repo';
import * as Promise from 'bluebird';
import * as urlInfoService from 'url';
import {Curl} from 'node-libcurl';
import {log} from "./logger";
import {IDocumentHttp, TaskDownload} from "../shared/typings";
import {progressNotification} from "./sockets";

const defaultOptions = {
    intervalTime: 600
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

    function isDocumentExists(url) {
        // todo implement function body
    }

    function downloadSeries() {
        return Promise.resolve(downloadTask.urls()).then((urls) => {
            let i = 0;
            const failedItems = [];
            return Promise.mapSeries(urls, function (target: string | any) {
                let url;
                if (_.isObject(target)) {
                    url = _.get(target, 'url');
                    delete target.url;
                } else {
                    url = target;
                }
                if (!_.isString(url)) {
                    console.error(url);
                    throw new Error(`URL must be string, but ${typeof url} was given`);
                }
                log(++i + '/' + urls.length + ' ' + url);
                return new Promise((resolve) => {
                    const curl = new Curl();
                    curl.setOpt(Curl.option.URL, url);
                    curl.setOpt(Curl.option.FOLLOWLOCATION, 1);
                    curl.setOpt(Curl.option.TIMEOUT, 30);

                    if (_.get(downloadTask, 'options.headers') && !_.isEmpty(downloadTask.options.headers)) {
                        curl.setOpt(Curl.option.HTTPHEADER, downloadTask.options.headers);
                    }

                    curl.on('end', function (statusCode, body, headers) {
                        let urlInfo = urlInfoService.parse(url);
                        let documentHttp: IDocumentHttp = {
                            type: curl.getInfo(Curl.info.CONTENT_TYPE),
                            name: downloadTask.name,
                            url: url,
                            host: urlInfo.hostname,
                            path: urlInfo.pathname,
                            query: urlInfo.query,
                            code: statusCode,
                            headers: (<any>JSON).stringify(headers),
                            body: body,
                            length: body.length
                        };
                        if (_.isObject(target)) {
                            documentHttp.metadata = (<any>JSON).stringify(target);
                        }

                        log(' [' + documentHttp.code + ']', 1);

                        if (200 !== documentHttp.code) {
                            failedItems.push({url: url, code: documentHttp.code});
                        }

                        repo.saveHttpDocument(documentHttp).then(() => {
                            const progress = i / urls.length;
                            progressNotification('terminal', downloadTask.type, downloadTask.name, progress);
                            this.close();
                            resolve();
                        });
                    });

                    curl.on('error', function (error, errCode) {
                        console.log(`Downloader error: ${errCode}`);
                        console.log(error);
                        console.log(`Faild on ${url}`, 1);
                        failedItems.push({url: url, error: error});
                        this.close();
                        resolve();
                    });

                    curl.perform();

                }).delay(_.get(downloadTask, 'options.intervalTime', options.intervalTime));
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
