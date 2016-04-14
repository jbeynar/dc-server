(function ()
{
    'use strict';

    const rfr = require('rfr');
    const db = rfr('libs/db');
    const DocumentDAO = rfr('libs/repo/DocumentDAO');
    const _ = require('lodash');
    const promise = require('bluebird');

    const Curl = require('node-libcurl').Curl;

    const defaultOptions = {
        downloadDelay: 500,
        silent: false
    };

    function downloadHttpDocuments(urls, httpHeaders)
    {
        if (!_.isArray(urls)) {
            throw new Error('urls param must be an array');
        }

        var options = defaultOptions;

        return db.connect().then(function (client)
        {
            var i = 0;
            return promise.each(urls, function (url)
            {
                console.log('%s/%s %s', ++i, urls.length, url);
                return new promise(function (resolve)
                {
                    var curl = new Curl();
                    curl.setOpt(Curl.option.URL, url);
                    curl.setOpt(Curl.option.FOLLOWLOCATION, 1);
                    curl.setOpt(Curl.option.TIMEOUT, 30);
                    if (!_.isEmpty(httpHeaders)) {
                        curl.setOpt(Curl.option.HTTPHEADER, httpHeaders);
                    }

                    // todo, how host and path can be captured?
                    curl.on('end', function (statusCode, body, headers)
                    {
                        let data = {
                            type: curl.getInfo(Curl.info.CONTENT_TYPE),
                            url: url,
                            //host: '',
                            //path: '',
                            code: statusCode,
                            headers: JSON.stringify(headers),
                            body: body,
                            length: body.length
                        };
                        DocumentDAO.saveHttpDocument(data).then(resolve);
                        this.close();
                    });

                    curl.on('error', function (error)
                    {
                        console.log('Downloader error');
                        console.log(error);

                    });

                    curl.perform();

                }).delay(options.downloadDelay);
            }).finally(client.done);
        }).catch(db.exceptionHandler);
    }

    module.exports = {
        downloadHttpDocuments: downloadHttpDocuments
    };

})();
