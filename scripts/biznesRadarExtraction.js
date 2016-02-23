'use strict';

const biznesRadarMap = require('./../assets/maps/biznesRadarProfile.js');
const db = require('../libs/db');
const squel = require('squel').useFlavour('postgres');
const extraction = require('../libs/extraction');
const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));
const _ = require('lodash');

function toSqlInsert(jsonDoc)
{
    var map = [];
    let symbol = jsonDoc.heading.match(/Notowania ([\w]{3,4})/)[1];
    let symbolLong = jsonDoc.heading.match(/\((.*)\)/);
    map.push(symbol);
    map.push(symbolLong && 2 === symbolLong.length ? symbolLong[1] : symbol);
    map.push(jsonDoc.name);
    map.push(jsonDoc.sector);
    map.push(jsonDoc.website);
    map.push(jsonDoc.description.replace(/'/g, '`'));
    return ("('" + map.join("', '") + "'),\n");
}

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
    var stmt = '';
    promise.each(documents, function (doc)
    {
        extraction.extract(doc.body, biznesRadarMap).then((obj)=>
        {
            stmt += toSqlInsert(obj);
        });
    }).then(()=>
    {
        console.log('Saving file');
        fs.writeFileAsync('seed/stocks-list.sql', stmt).then(()=>
        {
            console.log('DONE');
        });
    });
});
