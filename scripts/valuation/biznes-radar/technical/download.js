'use strict';

const rfr = require('rfr');
const db = rfr('libs/db');
const squel = require('squel').useFlavour('postgres');
const downloader = rfr('libs/downloader');
const _ = require('lodash');

const pattern = 'http://www.biznesradar.pl/get-indicators-json/?oid=$OID$&aggregate=1d';

function getSourceURLs()
{
    var query = squel.select().from('repo.document_json').field('body->>\'oid\'', 'oid').where('type=?', 'valuation.biznesradar').toString();
    return db.query(query).then(records =>
    {
        return _.map(records, record =>
        {
            return pattern.replace('$OID$', record.oid);
        });
    });
}

function downloadDocuments()
{
    return getSourceURLs().then(downloader.downloadHttpDocuments);
}
downloadDocuments();
module.exports = downloadDocuments;
