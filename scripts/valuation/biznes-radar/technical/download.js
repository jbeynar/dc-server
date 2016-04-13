'use strict';

const rfr = require('rfr');
const db = rfr('libs/db');
const squel = require('squel').useFlavour('postgres');
const downloader = rfr('libs/downloader');
const _ = require('lodash');

const pattern = 'http://www.biznesradar.pl/analiza-techniczna-wskazniki/$SYMBOL$#';

function getSourceURLs()
{
    var query = squel.select().from('stock').field('symbol').order('symbol').toString();
    return db.query(query).then(symbols =>
    {
        return _.map(symbols, item =>
        {
            return pattern.replace('$SYMBOL$', item.symbol);
        });
    });
}

module.exports = function ()
{
    return getSourceURLs().then(downloader.downloadHttpDocuments);
};
