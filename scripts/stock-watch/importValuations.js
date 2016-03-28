'use strict';

const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));
const Converter = require('csvtojson').Converter;
const squel = require('squel').useFlavour('postgres');
const rfr = require('rfr');
const db = rfr('libs/db');
const _ = require('lodash');
const DocumentDAO = rfr('libs/repo/DocumentDAO');

const valuationSwFilename = 'assets/stockwatch.pl-Wyceny-2016-03-06.csv';

function convertValuationSW()
{
    console.log('Reading valuation file');
    return fs.readFileAsync(valuationSwFilename).then(function (file)
    {
        console.log('Preparing to insert');
        var csv = file.toString();
        csv = csv.replace(/(\d+)(,)(\d+)/g, '$1.$3');
        var converter = new Converter({
            noheader: false,
            delimiter: ';',
            flatKeys: true
            //    headers: []
        });
        return converter.fromString(csv, function (err, json)
        {
            json.splice(json.length - 1, 1); // remove last line
            return db.connect().then(function (client)
            {
                promise.each(json, function (doc)
                {
                    var query = squel.select('symbol_long').from('stock').where('symbol_long=?', [doc.Spolka]).toParam();
                    return client.query(query.text, query.values).then((results)=>
                    {
                        doc.symbol = _.get(results, 'rows[0].symbol') || 'unmatched symbol';
                        return DocumentDAO.saveJsonDocument('valuation.stockwatch', doc);
                    });
                }).then(()=>
                {
                    console.log('Success!');
                    client.done();
                });
            });
        });
    });
}

convertValuationSW();
