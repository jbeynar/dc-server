var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
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
    return new Promise((resolve, reject)=>
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


//request.getAsync('http://www.biznesradar.pl/notowania/PKO').spread((instance, body) =>
//{
//console.log(body);
//var $ = cheerio.load(body);
//console.log($('h1').text());
//});
