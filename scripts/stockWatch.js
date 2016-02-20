'use strict';

var promise = require('bluebird');
var fs = promise.promisifyAll(fs = require('fs'));
var Converter = require('csvtojson').Converter;
var squel = require('squel');

var db = require('../libs/db');
var valuationSwFilename = './assets/stockwatch.pl-Wyceny-2016-02-14.csv';

function getSchemaDefinition()
{
    return fs.readFileAsync('./schemas/schema.sql').then(function (schema)
    {
        return schema.toString();
    });
}

function createSchema(schema)
{
    console.log('Creating schema');
    return db().then(function (client)
    {
        return client.query(schema).finally(client.done);
    });
}

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
            return db().then(function (client)
            {
                json.forEach(function (item)
                {
                    var insertQuery = squel.insert().into('stock').set('document_sw', JSON.stringify(item)).toString();
                    client.query(insertQuery);
                });
                console.log('Success!');
                client.done();
            });
        });

    });
}

getSchemaDefinition().then(createSchema).then(convertValuationSW);
