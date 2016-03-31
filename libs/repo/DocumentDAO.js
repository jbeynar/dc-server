(function ()
{
    'use strict';

    const rfr = require('rfr');
    const squel = require('squel').useFlavour('postgres');
    const db = rfr('libs/db');
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

    function getJsonDocuments()
    {
        return db.connect().then(function (client)
        {
            var query = squel.select().from('repo.document_json').order('id').where('id>?',1580);
            query.field('id');
            query.field('json_build_object(\'symbol\', body->>\'symbol\')','body');
            return client.query(query.toString()).then(function (results)
            {
                var maxPropsDoc = {};
                _.forEach(results.rows, function (item)
                {
                    _.assign(maxPropsDoc, item.body);
                });

                maxPropsDoc = _.zipObject(_.sortBy(_.keys(maxPropsDoc)), undefined);

                _.forEach(results.rows, function (item)
                {
                    item.body = _.assignIn({}, maxPropsDoc, item.body);
                });

                var a = {
                    crazy: undefined,
                    work: undefined,
                    done: undefined
                };

                var b = {
                    crazy:12,
                    none:34
                };

                return _.map(a, function (item)
                {
                    return item;
                });

                //return results.rows;
            }).finally(client.done);
        });
    }

    module.exports = {
        saveHttpDocument: saveHttpDocument,
        saveJsonDocument: saveJsonDocument,
        getJsonDocuments: getJsonDocuments
    };

})();
