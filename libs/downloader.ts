'use strict';

import _ = require('lodash');
import db = require('./db');
import repo = require('./repo');
import Promise = require('bluebird');
import urlInfoService = require('url');
import LibCurl = require('node-libcurl');

const Curl = LibCurl.Curl;
// const Curl = require('node-libcurl').Curl;
// import Curl from 'node-libcurl';

const defaultOptions = {
    intervalTime: 500
};

export interface ITaskDownload {
    type: 'download';
    name?: string;
    urls: any;
    options?: {
        headers?: string[];
        intervalTime?: number;
    };
}

export function downloadHttpDocuments(downloadJob : ITaskDownload) {

    if (_.isFunction((downloadJob.urls))) {
        downloadJob.urls = downloadJob.urls();
    } else if (!_.isArray(downloadJob.urls)) {
        throw new Error('downloadJob.urls param must be a function');
    }

    var options = defaultOptions;

    return Promise.resolve(downloadJob.urls).then((urls)=> {
        return db.connect().then(function (client) {
            var i = 0;
            return Promise.each(urls, function (url : string) {
                process.stdout.write(++i + '/' + urls.length + ' ' + url);
                return new Promise(function (resolve) {
                    var curl = new Curl();
                    curl.setOpt(Curl.option.URL, url);
                    curl.setOpt(Curl.option.FOLLOWLOCATION, 1);
                    curl.setOpt(Curl.option.TIMEOUT, 30);

                    if (_.get(downloadJob, 'options.headers') && !_.isEmpty(downloadJob.options.headers)) {
                        curl.setOpt(Curl.option.HTTPHEADER, downloadJob.options.headers);
                    }

                    curl.on('end', function (statusCode, body, headers) {
                        let urlInfo = urlInfoService.parse(url);
                        let data = {
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
                        process.stdout.write(' [' + data.code + ']\n');
                        repo.saveHttpDocument(data).then(resolve);
                        this.close();
                    });

                    curl.on('error', function (error) {
                        console.log('Downloader error');
                        console.log(error);
                    });

                    curl.perform();

                }).delay(_.get(downloadJob, 'options.intervalTime', options.intervalTime));
            }).finally(client.done);
        }).catch(db.exceptionHandler);
    });
}
