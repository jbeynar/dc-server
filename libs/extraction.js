'use strict';

const promise = require('bluebird');
const cheerio = require('cheerio');
const _ = require('lodash');

const errorCode = {
    docEmpty: 'ERR_DOC_EMPTY',
    mapInvalid: 'ERR_MAP_INVALID'
};

function extract(doc, map, props)
{
    return new Promise((resolve, reject) =>
    {
        var $, extracted = {};

        function extractOnce(def, key)
        {
            if (_.isArray(props) && -1 === _.indexOf(props, key)) {
                return;
            }

            var selector = _.isString(def) ? def : def.selector;

            var value = $(selector).text();

            if (_.isFunction(_.get(def, 'process'))) {
                try {
                    value = def.process(value);
                } catch (err) {
                    console.error('Process function fails at `' + key + '` cause:', err);
                }
            } else if (_.isString(_.get(def, 'process')) && _.isString(value)) {
                try {
                    value = _.head(value.match(new RegExp(def.process)));
                } catch (err) {
                    console.log('Process regular expression fails at `' + key, '` cause:', err);
                }
            }
            extracted[key] = value;
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
