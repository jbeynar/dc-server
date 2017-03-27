'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import Mongo = require('mongodb');
import pg = require('pg-rxjs');
import Squel = require('squel')
import {TaskExportMongodb} from "../shared/typings";
import {config} from '../config';

const squel = Squel.useFlavour('postgres');
const mongo = Mongo.MongoClient;

function handleError(err) {
    if (err) {
        console.error('Mongodb exception');
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

export function exportIntoMongo(exportTask: TaskExportMongodb) {
    let autoRemovePromise;

    if (exportTask.target.autoRemove) {
        autoRemovePromise = dropMongoCollections(exportTask.target.url, exportTask.target.collectionName);
    }

    return Promise.resolve(autoRemovePromise).then(() => {
        return new Promise((resolve)=> {
            let i = 0;
            return mongo.connect(exportTask.target.url, (err, client) => {
                handleError(err);
                const pool = pg.Pool(config.db.connectionUrl);
                let query = squel.select()
                    .from('repo.document_json')
                    .field('id')
                    .field('body')
                    .where('type=?', exportTask.sourceJsonDocuments.typeName);

                if (exportTask.sourceJsonDocuments.order) {
                    query = query.order(`body->>'${exportTask.sourceJsonDocuments.order}'`);
                }

                return pool.stream(query.toString())
                    .bufferWithCount(50)
                    .flatMap((documentsSet) => {
                        return new Promise((resolve)=> {
                            const targetCollection = client.collection(exportTask.target.collectionName, {}, handleError);

                            targetCollection.insertMany(_.map(documentsSet, (sourceDoc : any)=> {
                                    sourceDoc.body._sourceId = sourceDoc.id;
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
