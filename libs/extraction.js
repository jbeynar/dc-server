'use strict';

var promise = require('bluebird');
var cheerio = require('cheerio');
var fs = require('fs');
var _ = require('lodash');

var biznesRadarMap = require('././biznesRadar.map.js');

fs.readFile('./exampleBr.html', (err, document)=>
{
    console.log(processDocument(document.toString(), biznesRadarMap));
});

function processDocument(doc, map)
{
    return new promise((resolve, reject)=>
    {
        $ = cheerio.load(doc);
        var extracted = {};
        _.forEach(map, function (mapItem)
        {
            extracted[mapItem.as] = $(mapItem.select).text();
        });
        resolve(extracted);
    });
}
