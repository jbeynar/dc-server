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
    var data = [], whiteCard = ['symbol', 'value', 'cwk', 'cwk_rel', 'cz', 'cz_rel', 'cp_rel', 'czo_rel', 'roe_rel', 'roa_rel'];
    promise.each(documents, (doc)=>
    {
        return extraction.extract(doc.body, biznesRadarProfileMap, whiteCard).then((obj)=>
        {
            data.push(obj);
        });
    }).then(()=>
    {
        console.log('Saving data in database...');
        return db.connect().then(function (client)
        {
            client.query(squel.delete().from('valuation_br').toString()).then(()=>
            {
                return promise.each(data, (record)=>
                {
                    var ins = squel.insert().into('valuation_br').setFields(record).toParam();
                    return client.query(ins.text, ins.values).finally(client.done);
                });
            });
        });
    });
});
