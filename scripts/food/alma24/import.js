'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const db = rfr('libs/db');
const repo = rfr('libs/repo');
const _ = require('lodash');
const striptags = require('striptags');

const typeName = 'product';

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
            var obj, body;
            return promise.each(documents, (doc)=>
            {
                body = JSON.parse(doc.body);
                obj = {
                    ean: _.get(body, 'product.code'),
                    name: _.get(body, 'name'),
                    size: _.get(body, 'product.sizeWithUnitString'),
                    brand: _.get(body, 'brandView.name'),
                    ingredients: striptags(_.chain(_.get(body, 'descriptionAttributeSets'))
                        .filter(['name', 'Opisy'])
                        .first()
                        .get('descriptionAttributes')
                        .filter(['name', 'Skład'])
                        .first()
                        .get('value')
                        .value()),
                    components: []
                    // name: _.get(body, 'product.name'),
                    // slug: _.get(body, 'slug'),
                    // imageSlug: _.get(body, 'defaultImage.name')
                };
                return repo.saveJsonDocument(typeName, obj).then(()=> {
                    process.stdout.write('.')
                });
            }).then(()=> {
                obj = {
                    ean: 123456789,
                    productName: 'Reference product',
                    name: 'Reference product',
                    brand: 'JBL',
                    ingredients: 'Żółcień naturalna 3, Mydłoka, E967, Laktitol, Sóll aspartaamu-acesulfamu',
                    components: []
                };
                return repo.saveJsonDocument(typeName, obj);
            });
        }).finally(client.done);
    }).catch(db.exceptionHandler);
}

return repo.removeJsonDocuments(typeName).then(importDocuments).then(()=> {
    console.log('\nSuccess')
});
