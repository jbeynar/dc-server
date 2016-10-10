'use strict';

const _ = require('lodash');
const db = require('./db');
const repo = require('./repo');
const Promise = require('bluebird');
const urlInfoService = require('url');

const Curl = require('node-libcurl').Curl;

const defaultOptions = {
    downloadDelay: 500
};

function downloadHttpDocuments(downloadJob) {

    if (_.isFunction((downloadJob.urls))) {
        downloadJob.urls = downloadJob.urls();
    } else if (!_.isArray(downloadJob.urls)) {
        throw new Error('downloadJob.urls param must be an array');
    }

    var options = defaultOptions;

    return Promise.resolve(downloadJob.urls).then((urls)=> {
        return db.connect().then(function (client) {
            var i = 0;
            return Promise.each(urls, function (url) {
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

                }).delay(options.downloadDelay);
            }).finally(client.done);
        }).catch(db.exceptionHandler);
    });
}

module.exports = {
    downloadHttpDocuments: downloadHttpDocuments
};
