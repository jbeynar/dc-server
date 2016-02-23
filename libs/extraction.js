'use strict';

var promise = require('bluebird');
var cheerio = require('cheerio');
var _ = require('lodash');

function extract(doc, map)
{
    return new promise((resolve) =>
    {
        var $ = cheerio.load(doc);
        var extracted = {};
        _.forEach(map, function (mapItem)
        {
            extracted[mapItem.as] = $(mapItem.select).text();
        });
        return resolve(extracted);
    });
}

module.exports = {
    extract: extract
};
