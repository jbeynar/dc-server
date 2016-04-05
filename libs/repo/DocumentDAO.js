(function ()
{
    'use strict';

    const rfr = require('rfr');
    const squel = require('squel').useFlavour('postgres');
    var db = require('../db');
    const _ = require('lodash');

    function saveHttpDocument(data)
    {
        return db.connect().then(function (client)
        {
            var query = squel.insert().into('repo.document_http').setFields(data).toParam();
            return client.query(query.text, query.values).finally(client.done);
        }).catch(db.exceptionHandler);
    }

    function saveJsonDocument(type, obj)
    {
        return db.connect().then(function (client)
        {
            var json = JSON.stringify(obj);
            var data = {
                type: type,
                body: json,
                length: json.length || '0'
            };
            var query = squel.insert().into('repo.document_json').setFields(data).toParam();
            return client.query(query.text, query.values).finally(client.done);
        }).catch(db.exceptionHandler);
    }

    function getJsonDocuments(config)
    {
        var query = _.cloneDeep(config);
        console.log(query);
        var stmt = squel.select().from('repo.document_json').order('id');
        if (query.type) {
            stmt.where('type=?', query.type);
        }
        return db.query(stmt.toString()).then(function (rows)
        {
            var keys, allProps = {};
            _.forEach(rows, function (record)
            {
                _.assign(allProps, record.body);
            });
            allProps = _.keys(allProps);
            if (_.isEmpty(query.whitelist)) {
                keys = allProps;
                if (!_.isEmpty(query.blacklist)) {
                    keys = _.filter(keys, function (key)
                    {
                        return query.blacklist.indexOf(key) === -1;
                    });
                }
                keys = _.sortBy(keys);
            } else {
                keys = query.whitelist;
            }
            _.forEach(rows, function (record)
            {
                var sortedBody = {};
                _.forEach(keys, function (key)
                {
                    sortedBody[key] = record.body[key] || null;
                });
                record.body = sortedBody;
            });
            return {
                properties: allProps,
                results: rows
            };
        });
    }

    function getJsonDocumentsTypes()
    {
        var query = 'SELECT type, COUNT(*) as count, MAX(ts) as last_change FROM repo.document_json GROUP BY type';
        return db.query(query);
    }

    module.exports = {
        saveHttpDocument: saveHttpDocument,
        saveJsonDocument: saveJsonDocument,
        getJsonDocuments: getJsonDocuments,
        getJsonDocumentsTypes: getJsonDocumentsTypes
    };

})();
