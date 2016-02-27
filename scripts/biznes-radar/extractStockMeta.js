'use strict';
const _ = require('lodash');
const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));

const biznesRadarMap = require('./profile.map.js');
const db = rfr('libs/db');
const extraction = rfr('libs/extraction');

// TODO this file require to be adjustet after extraction upgrade

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
    /*jshint -W109*/
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
        console.log('Saving file stocks-list.sql');
        fs.writeFileAsync('stocks-list.sql', stmt).then(()=>
        {
            console.log('DONE');
        });
    });
});
