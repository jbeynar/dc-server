'use strict';

const db = require('../libs/db');
const squel = require('squel').useFlavour('postgres');
const _ = require('lodash');
const promise = require('bluebird');
const request = promise.promisifyAll(require('request'));

const downloadDelay = 1500; // ms
const binzesRaadarUrlPattern = 'http://www.biznesradar.pl/notowania/$SYMBOL_LONG$#1m_lin_lin';

function getSourceURLs()
{
    return db.connect().then(function (client)
    {
        let q = squel.select().from('stock').field('symbol').toString();
        return client.query(q).then((res)=>
        {
            return res.rows;
        }).finally(client.done);
    }).then((symbols)=>
    {
        return _.map(symbols, function (item)
        {
            return binzesRaadarUrlPattern.replace('$SYMBOL_LONG$', item.symbol);
        });
    });
}

function downloadDocuments(urls)
{
    return db.connect().then(function (client)
    {
        console.log('Start download', urls.length, 'documents');
        return promise.each(urls, function (url)
        {
            console.log('# Downloading', url);
            return request.getAsync(url).spread((response, body) =>
            {
                let data = {
                    type: response.headers['content-type'],
                    host: response.request.uri.hostname,
                    path: response.request.uri.pathname,
                    code: response.statusCode,
                    headers: JSON.stringify(response.headers),
                    body: body,
                    length: body.length
                };
                let query = squel.insert().into('document').setFields(data).toParam();
                return client.query(query.text, query.values).catch((err)=>
                {
                    console.log('ERROR while inserting document ' + url);
                    db.exceptionHandler(err);
                });
            }).catch((err)=>
            {
                console.log('ERROR while downloading document ' + url);
                console.log(err);
            }).finally(()=>
            {
                return promise.delay(downloadDelay);
            });
        }).finally(client.done);

    }).catch(db.exceptionHandler);
}

getSourceURLs().then((urls)=>
{
    downloadDocuments(urls).then(()=>
    {
        console.log('DONE');
        process.exit();
    }).catch(function (err)
    {
        console.log('Unrecognized error');
        console.log(err);
        process.exit(1);
    });
});

//downloadDocuments(testDocs);
