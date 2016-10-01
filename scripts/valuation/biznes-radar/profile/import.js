'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const extraction = rfr('libs/extraction');
const db = rfr('libs/db');
const repo = rfr('libs/repo');
const profileMap = require('./map.js');

var whiteList = ['oid',
                 'symbol',
                 'name',
                 'price',
                 'value',
                 'cwk',
                 'cwk_rel',
                 'cz',
                 'cz_rel',
                 'cp_rel',
                 'czo_rel',
                 'roe_rel',
                 'roa_rel'];


function importDocuments()
{
    return db.connect().then(function (client)
    {
        let query = squel.select().from('repo.document_http').where('url LIKE ?', '%www.biznesradar.pl/notowania%').toParam();
        return client.query(query.text, query.values).then((results)=>
        {
            return results.rows;
        }).then((documents)=>
        {
            console.log('Processing documents...');
            return promise.each(documents, (doc)=>
            {
                return extraction.extract(doc.body, profileMap, whiteList).then((extractedData)=>
                {
                    //TODO: How we can validate raw documents?
                    // Map constraint like length or selector might be approach
                    if ('Błąd 404' === extractedData.symbol) {
                        console.log('Wrong document format', doc.url);
                        return promise.resolve();
                    } else {
                        return repo.saveJsonDocument('valuation.biznesradar', extractedData);
                    }
                });
            });
        }).finally(client.done);
    }).catch(db.exceptionHandler);
}

module.exports = importDocuments;
