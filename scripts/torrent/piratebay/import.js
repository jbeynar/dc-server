'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const extraction = rfr('libs/extraction');
const db = rfr('libs/db');
const DocumentDAO = rfr('libs/repo/DocumentDAO');
const _ = require('lodash');

const host = 'thepiratebay.org';
const typeName = 'piratebay';
const map = {
    name: '#searchResult .detName a',
    href: {
        selector: '#searchResult .detName a',
        attribute: 'href'
    },
    magnet: {
        selector: '[href^="magnet"]',
        attribute: 'href'
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
                return extraction.extractArray(row.body, map).then(function (document)
                {
                    extracted.push(document);
                });
            }).then(function ()
            {
                var sorted = _.sortBy(extracted, 'code');
                console.log('Saving', sorted.length, 'rows');
                return promise.map(sorted, function (component)
                {
                    return DocumentDAO.saveJsonDocument(typeName, component);
                }, {concurrency: 1});
            });
        }).finally(client.done);
    }).catch(db.exceptionHandler);
}

importDocuments();
