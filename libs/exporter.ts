'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import Mongo = require('mongodb');
import pg = require('pg-rxjs');
import Squel = require('squel')

const squel = Squel.useFlavour('postgres');
const mongo = Mongo.MongoClient;
const config = require('../config');
//TODO: check whether config file work appropriate

function handleError(err) {
    if (err) {
        console.log('MongoDb Exception');
        throw err;
    }
}

export function dropMongoCollections(targetMongoDbUrl, collectionNames) {
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
                reject();
                throw err;
            }).finally(()=>{
                console.log('Collections removed: ', collectionNames);
                client.close();
                resolve();
            });
        });
    });
}

export function exportIntoMongo(exportTask) {
    let autoRemovePromise;
    if (_.get(exportTask, 'targetMongo.autoRemove')) {
        autoRemovePromise = dropMongoCollections(_.get(exportTask, 'targetMongo.url'),
            [_.get(exportTask, 'targetMongo.collectionName')]);
    }

    return Promise.resolve(autoRemovePromise).then(() => {
        return new Promise((resolve)=> {
            var i = 0;
            return mongo.connect(_.get(exportTask, 'targetMongo.url'), (err, client) => {
                handleError(err);
                const pool = pg.Pool(config.db.connectionUrl);
                var query = squel.select()
                    .from('repo.document_json')
                    .field('id')
                    .field('body')
                    .where('type=?', _.get(exportTask, 'sourceJsonDocuments.typeName'));

                if (_.has(exportTask, 'sourceJsonDocuments.order')) {
                    query = query.order(`body->>'${exportTask.sourceJsonDocuments.order}'`);
                }

                return pool.stream(query.toString())
                    .bufferWithCount(50)
                    .flatMap((documentsSet) => {
                        return new Promise((resolve)=> {
                            var targetCollection = client.collection(_.get(exportTask, 'targetMongo.collectionName'),
                                {},
                                handleError);

                            targetCollection.insertMany(_.map(documentsSet, (sourceDoc : any)=> {
                                    sourceDoc.body._source_id = sourceDoc.id;
                                    return sourceDoc.body;
                                }),
                                {},
                                (err) => {
                                    handleError(err);
                                    process.stdout.write('.');
                                    i += documentsSet.length;
                                    resolve();
                                });
                        });
                    })
                    .subscribe(() => {}, () => {}, () => {
                            console.log('\nSuccessfully exported', i, 'documents');
                            client.close();
                            return resolve();
                        }
                    );
            });
        });
    });
}
