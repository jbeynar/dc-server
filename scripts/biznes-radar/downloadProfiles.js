'use strict';

const rfr = require('rfr');
const db = rfr('libs/db');
const squel = require('squel').useFlavour('postgres');
const downloader = rfr('libs/downloader');
const _ = require('lodash');

function getSourceURLs()
{
    const pattern = 'http://www.biznesradar.pl/notowania/$SYMBOL_LONG$#1m_lin_lin';
    var query = squel.select().from('stock').field('symbol').order('symbol');
    return db.query(query).then(symbols =>
    {
        return _.map(symbols, item =>
        {
            return pattern.replace('$SYMBOL_LONG$', item.symbol);
        });
    });
}

getSourceURLs().then(downloader.downloadHttpDocuments).then(()=>
{
    console.log('DONE');
    process.exit();
}).catch(function (err)
{
    console.log('Unrecognized error');
    console.log(err);
    process.exit(1);
});
