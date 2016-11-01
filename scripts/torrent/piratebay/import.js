'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const extractor = rfr('libs/extractor');
const db = rfr('libs/db');
const repo = rfr('libs/repo');
const _ = require('lodash');

const host = 'thepiratebay.org';
const typeName = 'piratebay';
const mapping = {
    scope: 'table#searchResult tr',
    map: {
        name: {
            selector: '.detName a'
        },
        href: {
            multiple: true,
            selector: '.detName a',
            attribute: 'href'
        },
        magnet: {
            selector: '[href^="magnet"]',
            attribute: 'href'
        }
    },
    process: (extracted) =>
    {
        return extracted.slice(1);
    }
};

function importDocuments()
{
    return db.connect().then(function (client)
    {
        let query = squel.select().from('repo.document_http').where('host LIKE ?', host).toParam();
        return client.query(query.text, query.values).then(results => results.rows).then((rows)=>
        {
            console.log(`Extracting ${rows.length} rows...`);
            var extracted = [];
            return promise.each(rows, (row)=>
            {
                return extractor.extractArray(row.body, map).then(function (document)
                {
                    extracted.push(document);
                });
            }).then(function ()
            {
                var sorted = _.sortBy(extracted, 'code');
                console.log('Saving', sorted.length, 'rows');
                return promise.map(sorted, function (component)
                {
                    return repo.saveJsonDocument(typeName, component);
                }, {concurrency: 1});
            });
        }).finally(client.done);
    }).catch(db.exceptionHandler);
}

importDocuments();
