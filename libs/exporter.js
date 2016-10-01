'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('mongodb').MongoClient;
const pg = require('pg-rxjs');
const squel = require('squel').useFlavour('postgres');
const rfr = require('rfr');

const config = rfr('config');

function handleError(err) {
    if (err) {
        console.log('MongoDb Exception');
        throw err;
    }
}

function dropMongoCollections(targetMongoDbUrl, collectionNames) {
    return new Promise((resolve,reject)=>{
        mongo.connect(targetMongoDbUrl, function (err, client) {
            return Promise.map(collectionNames, function (collectionName) {
                return new Promise(function (resolve, reject) {
                    client.collection(collectionName).drop(function (err) {
                        if (err && err.message !== 'ns not found') {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }).catch((err)=>{
                console.log('Can not remove some collection');
                throw err;
                reject();
            }).finally(()=>{
                console.log('Collection removed');
                resolve();
            });
        });
    });
}

function exportIntoMongo(exportConfig) {
    return new Promise((resolve)=> {
        var i = 0;
        mongo.connect(exportConfig.targetMongoDbUrl, function (err, client) {
            handleError(err);
            const pool = pg.Pool(exportConfig.sourcePostgresqlUrl, { debug: false });
            const query = squel.select()
                .from('repo.document_json')
                .field('id')
                .field('body')
                .where('type=?', exportConfig.sourceTypeName)
                .toString();

            console.log('Streaming source repo documents', exportConfig.sourceTypeName, 'from',
                exportConfig.sourcePostgresqlUrl, 'into', exportConfig.targetMongoDbUrl, 'as',
                exportConfig.sourceTypeName);

            pool.stream(query)
                .bufferWithCount(100)
                .flatMap((documentsSet) => {
                    return new Promise((resolve, reject)=> {
                        var targetCollection = client.collection(exportConfig.targetCollectionName, {}, function (err) {
                            handleError(err);
                        });

                        targetCollection.insertMany(_.map(documentsSet, (sourceDoc)=> {
                                sourceDoc.body._source_id = sourceDoc.id;
                                return sourceDoc.body;
                            }),
                            {},
                            function (err) {
                                handleError(err);
                                process.stdout.write('.');
                                i += documentsSet.length;
                                resolve();
                            });
                    });
                })
                .subscribe(()=> {}, () => {},
                    (data) => {
                        console.log('\nSuccessfully exported', i, 'documents');
                        client.close();
                        return resolve();
                    }
                );
        });
    });
}

module.exports = {
    dropMongoCollections: dropMongoCollections,
    exportIntoMongo: exportIntoMongo
};
