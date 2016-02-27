'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const extraction = rfr('libs/extraction');
const db = rfr('libs/db');
const biznesRadarProfileMap = require('./profile.map.js');

return db.connect().then(function (client)
{
    let query = squel.select().from('document').where('host=?', 'www.biznesradar.pl').toParam();
    return client.query(query.text, query.values).then((results)=>
    {
        return results.rows;
    }).finally(client.done);
}).then((documents)=>
{
    console.log('Processing documents...');
    var data = [];
    promise.each(documents, (doc)=>
    {
        return extraction.extract(doc.body, biznesRadarProfileMap, ['symbol', 'valuation']).then((obj)=>
        {
            data.push(obj);
        });
    }).then(()=>
    {
        console.log('Data extracted.');
        console.log(data);

        // TODO save data into database
    });
});
