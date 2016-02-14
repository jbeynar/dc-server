var Promise = require('bluebird');
var fs = Promise.promisifyAll(fs = require('fs'));
var Converter = require('csvtojson').Converter;
var squel = require('squel');

var db = require('./db');
var valuationSwFilename = 'stockwatch.pl-Wskazniki-2016-02-14.csv';
var connectionUrl = 'postgres://realskill:realskill@localhost/realskill';

function getSchema()
{
    return fs.readFileAsync('schema.sql').then(function (schema)
    {
        return schema.toString();
    })
}

function createSchema(schema)
{
    return db(connectionUrl).then(function (client)
    {
        return client.query(schema).finally(client.done);
    });
}

function convertValuationSW()
{
    return fs.readFileAsync(valuationSwFilename).then(function (file)
    {
        var csv = file.toString();
        var converter = new Converter({
            noheader: false,
            delimiter: ';'
        });
        return converter.fromString(csv, function (err, json)
        {
            return db(connectionUrl).then(function (client)
            {
                json.forEach(function (item)
                {
                    var insertQuery = squel.insert().into('stock').set('document_sw', JSON.stringify(item)).toString();
                    client.query(insertQuery);
                });
                client.done();
            });
        });

    });
}

getSchema().then(createSchema).then(convertValuationSW);
