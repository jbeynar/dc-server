'use strict';

const _ = require('lodash');
const promise = require('bluebird');
const cheerio = require('cheerio');

const errorCode = {
    docEmpty: 'ERR_DOC_EMPTY',
    mapInvalid: 'ERR_MAP_INVALID'
};

function extractArray(doc, map, whitelist)
{
    return new Promise((resolve, reject) =>
    {
        var $, extracted = {};

        function extractOnce(def, key)
        {
            if (_.isArray(whitelist) && !_.includes(whitelist, key)) {
                return;
            }

            var selector = _.isString(def) ? def : def.selector;
            var elements = $(selector);
            extracted[key] = _.map(elements, function (element)
            {
                element = $(element);
                var value = def.attribute ? element.attr(def.attribute) : element.text();

                if (_.isFunction(def.process)) {
                    try {
                        value = def.process(value, element);
                    } catch (err) {
                        console.error('Process function fails at `' + key + '` cause:', err);
                    }
                } else if (_.isString(def.process) && _.isString(value)) {
                    try {
                        value = _.head(value.match(new RegExp(def.process)));
                    } catch (err) {
                        console.log('Process regular expression string fails at `' + key, '` cause:', err);
                    }
                } else if (_.isRegExp(def.process) && _.isString(value)) {
                    try {
                        value = _.head(value.match(def.process));
                    } catch (err) {
                        console.log('Process regular expression fails at `' + key, '` cause:', err);
                    }
                }
                return value;
            });
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

function extract(doc, map, whitelist)
{
    return extractArray(doc, map, whitelist).then((extractions)=>
    {
        return _.mapValues(extractions, function (value)
        {
            return _.first(value);
        });
    });
}

module.exports = {
    extract: extract,
    extractArray: extractArray,
    errorCodes: errorCode
};
