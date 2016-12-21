'use strict';

import * as _ from 'lodash';
import * as db from './db';
import * as repo from './repo';
import * as Promise from 'bluebird';
import * as urlInfoService from 'url';
import {Curl} from 'node-libcurl';
import {log} from "./logger";
import {TaskDownload} from "../shared/typings";
import {progressNotification, emit} from "./sockets";

const defaultOptions = {
    intervalTime: 600
};

export function downloadHttpDocuments(downloadTask: TaskDownload): Promise<any> {
    const options = defaultOptions;

    function autoRemoveSeries() {
        if (downloadTask.autoRemove) {
            log(`Removing all http documents with name ${downloadTask.name}`);
            return repo.removeHttpDocumentsByName(downloadTask.name);
        } else {
            return Promise.resolve();
        }
    }

    function isDocumentExists(url) {
        // todo
        // repo.isDocumentExists
    }

    function downloadSeries() {
        return Promise.resolve(downloadTask.urls()).then((urls) => {
            let i = 0;
            const faildDownloads = [];
            return Promise.mapSeries(urls, function (url: string) {
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
                        let documentHttp = {
                            type: curl.getInfo(Curl.info.CONTENT_TYPE),
                            name: downloadTask.name,
                            url: url,
                            host: urlInfo.hostname,
                            path: urlInfo.pathname,
                            query: urlInfo.query,
                            code: statusCode,
                            headers: JSON.stringify(headers),
                            body: body,
                            length: body.length
                        };

                        log(' [' + documentHttp.code + ']', 1);

                        if (200 !== documentHttp.code) {
                            faildDownloads.push({url: url, code: documentHttp.code});
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
                        faildDownloads.push({url: url, error: error});
                        this.close();
                        resolve();
                    });

                    curl.perform();

                }).delay(_.get(downloadTask, 'options.intervalTime', options.intervalTime));
            }).catch(db.exceptionHandler).then(() => {
                if (!_.isEmpty(faildDownloads)) {
                    console.log('Fail on some URLs');
                    console.log(JSON.stringify(faildDownloads, null, 4));
                } else {
                    console.log('All URLs downloaded successfully');
                }
            });
        });
    }

    return autoRemoveSeries().then(downloadSeries);
}
