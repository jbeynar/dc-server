'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const db = rfr('libs/db');
const DocumentDAO = rfr('libs/repo/DocumentDAO');
const _ = require('lodash');
const striptags = require('striptags');

function importDocuments()
{
    return db.connect().then(function (client)
    {
        let query = squel.select().from('repo.document_http').where('host LIKE ?', 'www.alma24.pl').toParam();
        return client.query(query.text, query.values).then((results)=>
        {
            return results.rows;
        }).then((documents)=>
        {
            console.log('Processing documents...');
            return promise.each(documents, (doc)=>
            {
                var body = JSON.parse(doc.body);
                var obj = {
                    ean: _.get(body, 'product.code'),
                    productName: _.get(body, 'name'),
                    name: _.get(body, 'product.name'),
                    size: _.get(body, 'product.sizeWithUnitString'),
                    brand: _.get(body, 'brandView.name'),
                    slug: _.get(body, 'slug'),
                    ingredients: striptags(_.chain(_.get(body, 'descriptionAttributeSets'))
                        .filter(['name', 'Opisy'])
                        .first()
                        .get('descriptionAttributes')
                        .filter(['name', 'Skład'])
                        .first()
                        .get('value')
                        .value()),
                    imageSlug: _.get(body, 'defaultImage.name')
                };
                return DocumentDAO.saveJsonDocument('alma24', obj);
            });
        }).finally(client.done);
    }).catch(db.exceptionHandler);
}

importDocuments();
