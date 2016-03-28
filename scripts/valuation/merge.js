const rfr = require('rfr');
const db = rfr('libs/db');
const squel = require('squel').useFlavour('postgres');
const DocumentDAO = rfr('libs/repo/DocumentDAO');
const promise = require('bluebird');
const _ = require('lodash');

function merge()
{
    return db.connect().then(function (client)
    {
        console.log('Processing documents...');
        var query = squel.select().from('repo.document_json').field('body').where('type=?', 'valuation.biznesradar').toParam();
        return client.query(query.text, query.values).then((resultsBR)=>
        {
            return promise.each(resultsBR.rows, function (documentBr)
            {
                var valuationDocument = documentBr.body;
                var q2 = squel.select('body')
                    .from('repo.document_json')
                    .field('body')
                    .where('type=\'valuation.stockwatch\'')
                    .where('body->>\'symbol\'=?', valuationDocument.symbol)
                    .toParam();
                return client.query(q2.text, q2.values).then(function (documentSW)
                {
                    if (documentSW.rows && _.isObject(documentSW.rows[0])) {
                        _.assign(valuationDocument, documentSW.rows[0].body);
                    }
                    return DocumentDAO.saveJsonDocument('valuation', valuationDocument);
                });
            });
        }).then(function ()
        {
            console.log('Done');
            client.done();
        }).catch(db.exceptionHandler);
    });
}

merge();
