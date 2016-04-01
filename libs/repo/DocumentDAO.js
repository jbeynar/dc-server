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

    function getJsonDocuments(whiteList, blackList)
    {
        var query = squel.select().from('repo.document_json').order('id').where('id>?', 3053);
        return db.query(query.toString()).then(function (rows)
        {
            var keys;
            if (_.isEmpty(whiteList)) {
                keys = {};
                _.forEach(rows, function (record)
                {
                    _.assign(keys, record.body);
                });
                keys = _.keys(keys);
                if (!_.isEmpty(blackList)) {
                    keys = _.filter(keys, function (key)
                    {
                        return blackList.indexOf(key) === -1;
                    });
                }
                keys = _.sortBy(keys);
            } else {
                keys = whiteList;
            }

            _.forEach(rows, function (record)
            {
                var sortedBody = {};
                _.forEach(keys, function (key)
                {
                    sortedBody[key] = record.body[key];
                });
                record.body = sortedBody;
            });
            return rows;
        });
    }

    module.exports = {
        saveHttpDocument: saveHttpDocument,
        saveJsonDocument: saveJsonDocument,
        getJsonDocuments: getJsonDocuments
    };

})();
