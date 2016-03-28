'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const extraction = rfr('libs/extraction');
const db = rfr('libs/db');
const DocumentDAO = rfr('libs/repo/DocumentDAO');
const biznesRadarProfileMap = require('./profile.map.js');


return db.connect().then(function (client)
{
    let query = squel.select().from('repo.document_http').where('url LIKE ?', '%biznesradar%').toParam();
    return client.query(query.text, query.values).then((results)=>
    {
        return results.rows;
    }).then((documents)=>
    {
        console.log('Processing documents...');
        var whiteList = ['symbol',
                         'value',
                         'price',
                         'cwk',
                         'cwk_rel',
                         'cz',
                         'cz_rel',
                         'cp_rel',
                         'czo_rel',
                         'roe_rel',
                         'roa_rel'];
        return promise.each(documents, (doc)=>
        {
            return extraction.extract(doc.body, biznesRadarProfileMap, whiteList).then((extractedData)=>
            {
                //TODO: How we can validate raw documents?
                // Map constraint like length or selector might be approach
                if ('Błąd 404' === extractedData.symbol) {
                    console.log('Wrong document format', doc.url);
                    return promise.resolve();
                } else {
                    return DocumentDAO.saveJsonDocument('valuation.biznesradar', extractedData);
                }
            });
        });
    }).finally(client.done);
}).catch(db.exceptionHandler);
