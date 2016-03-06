'use strict';

const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));
const Converter = require('csvtojson').Converter;
const squel = require('squel').useFlavour('postgres');
const rfr = require('rfr');
const db = rfr('libs/db');

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
                json.forEach(function (doc)
                {
                    let data = {
                        type: 'stockwatch.valuation',
                        body: JSON.stringify(doc)
                    };
                    data.length = data.body.length;

                    var query = squel.insert().into('repo.document_json').setFields(data).toParam();
                    client.query(query.text, query.values).catch(db.exceptionHandler);
                });
                console.log('Success!');
                client.done();
            });
        });

    });
}

convertValuationSW();
