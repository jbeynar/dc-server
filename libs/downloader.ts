'use strict';

import _ = require('lodash');
import db = require('./db');
import repo = require('./repo');
import Promise = require('bluebird');
import urlInfoService = require('url');
import LibCurl = require('node-libcurl');
import {log} from "./logger";
import {TaskDownload} from "../shared/typings";

const Curl = LibCurl.Curl;

const defaultOptions = {
    intervalTime: 600
};

export function downloadHttpDocuments(downloadJob: TaskDownload): Promise<any> {
    var options = defaultOptions;

    function autoRemoveSeries() {
        if (downloadJob.autoRemove) {
            console.log(`Removing all http documents with name ${downloadJob.name}`);
            return repo.removeHttpDocumentsByName(downloadJob.name);
        } else {
            return Promise.resolve();
        }
    }

    function downloadSeries() {
        return Promise.resolve(downloadJob.urls()).then((urls) => {
            var i = 0;
            return Promise.mapSeries(urls, function (url: string) {
                process.stdout.write(++i + '/' + urls.length + ' ' + url);
                return new Promise((resolve) => {
                    var curl = new Curl();
                    curl.setOpt(Curl.option.URL, url);
                    curl.setOpt(Curl.option.FOLLOWLOCATION, 1);
                    curl.setOpt(Curl.option.TIMEOUT, 30);

                    if (_.get(downloadJob, 'options.headers') && !_.isEmpty(downloadJob.options.headers)) {
                        curl.setOpt(Curl.option.HTTPHEADER, downloadJob.options.headers);
                    }

                    curl.on('end', function (statusCode, body, headers) {
                        let urlInfo = urlInfoService.parse(url);
                        let documentHttp = {
                            type: curl.getInfo(Curl.info.CONTENT_TYPE),
                            name: downloadJob.name,
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
                            this.close
                        }));
                    });

                    curl.on('error', function (error, errCode) {
                        console.log('Downloader error', errCode);
                        console.log(error);
                        console.log('Ommiting', url);
                        this.close();
                        resolve();
                    });

                    curl.perform();

                }).delay(_.get(downloadJob, 'options.intervalTime', options.intervalTime));
            }).catch(db.exceptionHandler);
        });
    }

    return autoRemoveSeries().then(downloadSeries);
}
