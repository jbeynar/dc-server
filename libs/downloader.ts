'use strict';

import * as _ from 'lodash';
import * as db from './db';
import * as repo from './repo';
import * as Promise from 'bluebird';
import * as urlInfoService from 'url';
import {Curl} from 'node-libcurl';
import {log} from "./logger";
import {TaskDownload} from "../shared/typings";
import {progressNotification} from "./sockets";

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

    function downloadSeries() {
        return Promise.resolve(downloadTask.urls()).then((urls) => {
            let i = 0;
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
                        resolve(repo.saveHttpDocument(documentHttp).then(() => {
                            const progress = i / urls.length;
                            progressNotification('terminal', downloadTask.name, progress);

                            // todo what thay close is for? is scope bind right?
                            this.close();
                        }));
                    });

                    curl.on('error', function (error, errCode) {
                        log(`Downloader error: ${errCode}`, 1);
                        log(error, 1);
                        log(`Ommiting ${url}`, 1);
                        this.close();
                        resolve();
                    });

                    curl.perform();

                }).delay(_.get(downloadTask, 'options.intervalTime', options.intervalTime));
            }).catch(db.exceptionHandler);
        });
    }

    return autoRemoveSeries().then(downloadSeries);
}
