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

    function saveJsonDocument(type, json)
    {
        return db.connect().then(function (client)
        {
            var data = {
                type: type,
                body: json, // todo end here incorrect json
                length: json.length || '0'
            };
            var query = squel.insert().into('repo.document_json').setFields(data).toParam();
            return client.query(query.text, query.values).finally(client.done);
        }).catch(db.exceptionHandler);
    }

    module.exports = {
        saveHttpDocument: saveHttpDocument,
        saveJsonDocument: saveJsonDocument
    };

})();
