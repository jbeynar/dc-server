'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import cheerio = require('cheerio');
import db = require('./db');
import Squel = require('squel');
import repo = require('./repo');
import logger = require('./logger');

const squel = Squel.useFlavour('postgres');

export const errorCodes = {
    documentMalformedStructure: 'ERR_DOCUMENT_MALFORMED_STRUCTURE',
    documentBodyEmpty: 'ERR_DOCUMENT_BODY_EMPTY',
    taskMalformedStructure: 'ERR_TASK_MALFORMED_STRUCTURE'
};

export interface IMapProperty {
    attribute?: string,
    singular?: boolean;
    selector: string;
    process?: (text)=>any;
}

interface IRepoDocumentHttp {
    id: number;
    type: string;
    url: string;
    host: string;
    path: string;
    query: string;
    code: number;
    headers: any;
    body: string;
    length: number;
    retry_count: number;
    ts: any
}

export interface ITaskExtract {
    type: 'extract';
    sourceHttpDocuments: {
        host: string;
    };
    targetJsonDocuments: {
        typeName: string;
        autoRemove: boolean;
    };
    scope?: string;
    map: {
        [key: string]: string|IMapProperty;
    };
    process: (extracted: any, doc: IRepoDocumentHttp) => any;
}

export function extract(document, extractionTask, whitelist?)
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

            var res = _.map(elements, (element : any) =>
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
                        logger.error('Process regular expression string fails at `' + key, '` cause:', err);
                    }
                } else if (_.isRegExp(def.process) && _.isString(value)) {
                    try {
                        value = _.head(value.match(def.process));
                    } catch (err) {
                        logger.error('Process regular expression fails at `' + key, '` cause:', err);
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

export function extractFromRepo(extractionTask : ITaskExtract)
{
    return new Promise((resolve)=>
    {
        if (extractionTask.targetJsonDocuments.autoRemove) {
            return repo.removeJsonDocuments(extractionTask.targetJsonDocuments.typeName).then(resolve);
        }
        resolve();
    }).then(() =>
    {
        let query = squel.select().from('repo.document_http');
        _.each(extractionTask.sourceHttpDocuments, (value, field) =>
        {
            query.where(field + (_.isString(value) ? ' LIKE ?' : ' = ?'), value);
        });
        query = query.toParam();

        return db.query(query.text, query.values).then((rows)=>
        {
            logger.log(`Extracting ${rows.length} rows...`, 1);
            var i = 0;
            return Promise.map(rows, (row)=>
            {
                return extract(row, extractionTask).then(document =>
                {
                    if (_.isEmpty(document)) {
                        return Promise.resolve();
                    } else if (_.isArray(document)) {
                        return Promise.map(document, (doc) => {
                            return repo.saveJsonDocument(extractionTask.targetJsonDocuments.typeName, doc).then(()=>i++);
                        });
                    }
                    return repo.saveJsonDocument(extractionTask.targetJsonDocuments.typeName, document).then(()=>i++);
                });
            }, { concurrency: 1 }).finally(()=> {
                logger.log(`Saved ${i} JSON documents`, 1);
            });
        });
    });
}
