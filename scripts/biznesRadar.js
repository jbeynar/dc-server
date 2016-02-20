'use strict';

const db = require('../libs/db');
const squel = require('squel');
const _ = require('lodash');

function getSourceURLs()
{
    return db().then(function (client)
    {
        let q = squel.select().from('stock').field('document_sw->>\'Spolka\'', 'symbol').toString();
        return client.query(q).then((res)=>
        {
            return res.rows;
        }).finally(client.done);
    }).then((symbols)=>
    {
        return _.map(symbols, function (item)
        {

        });
    });
}

getSourceURLs();

//request.getAsync('http://www.biznesradar.pl/notowania/PKO').spread((instance, body) =>
//{
//});
