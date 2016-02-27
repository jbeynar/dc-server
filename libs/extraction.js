'use strict';

const promise = require('bluebird');
const cheerio = require('cheerio');
const _ = require('lodash');

const errorCode = {
    docEmpty: 'ERR_DOC_EMPTY',
    mapInvalid: 'ERR_MAP_INVALID'
};

function extract(doc, map)
{
    return new Promise((resolve, reject) =>
    {
        var $, extracted = {};

        function extractOnce(def, key)
        {
            var selector = _.isString(def) ? def : def.selector;

            var match = $(selector).text();
            if (_.isObject(def) && def.process && def.process instanceof Function) {
                match = def.process('' + match);
            }
            extracted[key] = match;
        }

        if (_.isEmpty(doc)) {
            return reject(new Error(errorCode.docEmpty));
        }

        if (!_.isObject(map)) {
            return reject(new Error(errorCode.mapInvalid));
        }

        $ = cheerio.load(doc);

        _.forEach(map, extractOnce);

        return resolve(extracted);
    });
}

module.exports = {
    extract: extract,
    errorCodes: errorCode
};
