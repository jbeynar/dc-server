'use strict';

const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));
const Converter = require('csvtojson').Converter;
const squel = require('squel').useFlavour('postgres');
const rfr = require('rfr');
const db = rfr('libs/db');

const valuationSwFilename = './../assets/stockwatch.pl-Wyceny-2016-02-14.csv';

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
        });
        return converter.fromString(csv, function (err, json)
        {
            json.splice(json.length - 1, 1);
            return db.connect().then(function (client)
            {
                json.forEach(function (doc)
                {
                    var query = squel.insert().into('valuation_sw').set('document', JSON.stringify(doc)).toParam();
                    client.query(query.text, query.values);
                });
                console.log('Success!');
                client.done();
            });
        });

    });
}

convertValuationSW();
