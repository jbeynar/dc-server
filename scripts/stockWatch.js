var Promise = require('bluebird');
var fs = Promise.promisifyAll(fs = require('fs'));
var Converter = require('csvtojson').Converter;
var squel = require('squel');

var db = require('./../lib/db');
var valuationSwFilename = 'stockwatch.pl-Wyceny-2016-02-14.csv';
var connectionUrl = 'postgres://realskill:realskill@localhost/realskill';

function getSchemaDefinition()
{
    return fs.readFileAsync('schema.sql').then(function (schema)
    {
        return schema.toString();
    })
}

function createSchema(schema)
{
    console.log('Creating schema');
    return db(connectionUrl).then(function (client)
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
            console.log(json);
            json.splice(json.length-1,1);
            return db(connectionUrl).then(function (client)
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
