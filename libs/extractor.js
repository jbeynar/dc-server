'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const cheerio = require('cheerio');
const db = require('./db');
const squel = require('squel').useFlavour('postgres');
const repo = require('./repo');

const errorCodes = {
    documentMalformedStructure: 'ERR_DOCUMENT_MALFORMED_STRUCTURE',
    documentBodyEmpty: 'ERR_DOCUMENT_BODY_EMPTY',
    taskMalformedStructure: 'ERR_TASK_MALFORMED_STRUCTURE'
};

function extract(document, extractionTask, whitelist)
{
    return new Promise((resolve, reject) =>
    {
        var $;

        function extractOnce($scope, def, key)
        {
            if (_.isArray(whitelist) && !_.includes(whitelist, key)) {
                return null;
            }

            var selector = _.isString(def) ? def : def.selector;
            var elements = $scope.find(selector);

            var res = _.map(elements, (element) =>
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

            return def.singular ? _.first(res) : res;
        }

        function extractAll($scope, map)
        {
            var extracted = {};

            _.forEach(map, (def, key) =>
            {
                var value = extractOnce($scope, def, key);

                if (value !== null) {
                    extracted[key] = value;
                }
            });

            return extracted;
        }

        if (!_.isObject(document) || _.isEmpty(document)) {
            return reject(new Error(errorCodes.documentMalformedStructure));
        }
        if (_.isEmpty(document.body)) {
            return reject(new Error(errorCodes.documentBodyEmpty));
        }
        if (_.isEmpty(extractionTask)) {
            return reject(new Error(errorCodes.taskMalformedStructure));
        }

        $ = cheerio.load(document.body);

        if (extractionTask.scope) {
            resolve(_.map($(extractionTask.scope), scope => extractAll($(scope), extractionTask.map)));
        } else {
            resolve(extractAll($('html'), extractionTask.map));
        }
    }).then((extracted) =>
    {
        return _.isFunction(extractionTask.process) ? extractionTask.process(extracted, document) : extracted;
    });
}

function extractFromRepo(extractionJob)
{
    return new Promise((resolve)=>
    {
        if (extractionJob.targetJsonDocuments.autoRemove) {
            return repo.removeJsonDocuments(extractionJob.targetJsonDocuments.typeName).then(resolve);
        }
        resolve();
    }).then(() =>
    {
        let query = squel.select().from('repo.document_http');
        _.each(extractionJob.sourceHttpDocuments, (value, field) =>
        {
            query.where(field + (_.isString(value) ? ' LIKE ?' : ' = ?'), value);
        });
        query = query.toParam();

        return db.query(query.text, query.values).then((rows)=>
        {
            console.log(`Extracting ${rows.length} rows...`);
            var i = 0;
            return Promise.each(rows, (row)=>
            {
                return extract(row, extractionJob).then(document =>
                {
                    if (null == document || _.isEmpty(document)) {
                        return Promise.resolve();
                    } else if (_.isArray(document)) {
                        return Promise.map(document, (doc) => {
                            return repo.saveJsonDocument(extractionJob.targetJsonDocuments.typeName, doc).then(()=>i++);
                        });
                    }
                    return repo.saveJsonDocument(extractionJob.targetJsonDocuments.typeName, document).then(()=>i++);
                });
            }).finally(()=>{
                console.log(`Saved ${i} JSON documents`);
            });
        });
    });
}

module.exports = {
    errorCodes,
    extract,
    extractFromRepo
};
