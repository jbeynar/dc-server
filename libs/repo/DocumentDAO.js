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

    function getJsonDocuments(){
        return db.connect().then(function (client)
        {
            var query = squel.select().from('repo.document_json').order('id').toString();
            query='SELECT * FROM repo.document_json WHERE id IN (1956);';
            return client.query(query).then(function (results)
            {
                var maxPropsDoc = {};
                _.forEach(results.rows, function (item)
                {
                    _.assign(maxPropsDoc,item.body);
                });
                var keys = _.keys(maxPropsDoc);
                // sort
                return maxPropsDoc;
            }).finally(client.done);
        });
    }

    module.exports = {
        saveHttpDocument: saveHttpDocument,
        saveJsonDocument: saveJsonDocument,
        getJsonDocuments: getJsonDocuments
    };

})();
