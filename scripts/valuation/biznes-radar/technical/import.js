'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const extraction = rfr('libs/extraction');
const db = rfr('libs/db');
const DocumentDAO = rfr('libs/repo/DocumentDAO');

var map = require('./map.js');
var type = 'biznesradar.technical';

// todo it's wont work cause the data comes from JSON API

function importDocuments()
{
    return db.connect().then(function (client)
    {
        let query = squel.select().from('repo.document_http').where('url LIKE ?', '%www.biznesradar.pl/analiza-techniczna-wskazniki/%').toParam();
        return client.query(query.text, query.values).then((results)=>
        {
            return results.rows;
        }).then((documents)=>
        {
            console.log('Processing documents...');
            return promise.each(documents, (doc)=>
            {
                return extraction.extract(doc.body, map).then((extractedData)=>
                {
                    return DocumentDAO.saveJsonDocument(type, extractedData);
                });
            });
        }).finally(client.done);
    }).catch(db.exceptionHandler);
}

module.exports = importDocuments;
