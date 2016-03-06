(function ()
{
    'use strict';

    const rfr = require('rfr');
    const db = rfr('libs/db');
    const DocumentDAO = rfr('libs/repository/DocumentDAO');
    const _ = require('lodash');
    const promise = require('bluebird');

    const request = promise.promisifyAll(require('request'));

    const defaultOptions = {
        downloadDelay: 3000,
        silent: false
    };

    function downloadHttpDocuments(urls, saveFn)
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
                return request.getAsync(url).spread((response, body) =>
                {
                    console.log('OK');
                    let data = {
                        type: response.headers['content-type'],
                        url: url,
                        host: response.request.uri.hostname,
                        path: response.request.uri.pathname,
                        code: response.statusCode,
                        headers: JSON.stringify(response.headers),
                        body: body,
                        length: body.length
                    };
                    if (_.isFunction(saveFn)) {
                        return saveFn(data);
                    } else {
                        return DocumentDAO.saveHttpDocument(data);
                    }
                }).catch((err)=>
                {
                    console.log(err);
                }).finally(()=>
                {
                    return promise.delay(options.downloadDelay);
                });
            }).finally(client.done);
        }).catch(db.exceptionHandler);
    }

    module.exports = {
        downloadHttpDocuments: downloadHttpDocuments
    };

})();
