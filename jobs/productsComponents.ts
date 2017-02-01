'use strict';

import * as Rx from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as pg from 'pg';
import * as db from '../libs/db';
import {config} from '../config';
import {TaskScript, TaskExport} from "../shared/typings";
import {log} from "../libs/logger";

export class produce extends TaskScript {
    script() {
        const pool = db.getPool();

        function createIngredientObservable(): Rx.Observable<any> {
            const query = `SELECT body FROM repo.document_json WHERE type = 'ingredient'`;

            return Rx.Observable.create((subscriber) => {
                pool.connect().then((client: pg.Client) => {
                    const stream: pg.Query = client.query(query, () => {
                    });

                    stream.on('row', (row) => {
                        subscriber.next(row);
                    });

                    stream.on('end', () => {
                        subscriber.complete();
                        client.release();
                    });
                });
            });
        }

        function mapIngredient(ingredient) {
            return {
                meta: {
                    code: ingredient.body.code,
                    name: ingredient.body.name,
                    rating: ingredient.body.rating,
                },
                searchVector: _.chain(ingredient.body.names)
                    .map(name => name.replace(/ +/g, ' & '))
                    .join(' | ').value()
            }
        }

        function searchIngredientInProducts(ingredient) {
            const query = `SELECT id, body FROM repo.document_json 
                WHERE type = 'product' AND to_tsvector(body->>'ingredients') @@ to_tsquery($1)`;

            return pool.connect().then((client) => {
                return client.query(query, [ingredient.searchVector]).then((products) => {
                    client.release();
                    return {ingredient: ingredient.meta, products: _.map(products.rows, 'id')};
                }).catch((err) => {
                    console.error('SQL ERROR IN searchIngredientInProducts');
                    console.log(err.toLocaleString());
                    client.release();
                });
            });
        }

        function reduceSearchResults(acc, x) {
            if (!_.isObject(x)) {
                return acc;
            }
            _.forEach(x.products, (p) => {
                if (acc[p]) {
                    acc[p].push(x.ingredient);
                } else {
                    acc[p] = [x.ingredient];
                }
            });
            return acc;
        }

        function mapDictionaryToArray(dictionary) {
            return _.map(dictionary, (value, key: string) => {
                return {productId: parseInt(key), ingredients: value};
            });
        }

        function updateProducts(e) {
            const querySearchProduct = 'SELECT body FROM repo.document_json WHERE id=$1';
            const queryUpdateProduct = 'UPDATE repo.document_json SET body=$1 WHERE id=$2';

            return pool.connect().then((client) => {
                return client.query(querySearchProduct, [e.productId]).then((res) => {
                    res.rows[0].body.components = e.ingredients;
                    return db.query(queryUpdateProduct, [JSON.stringify(res.rows[0].body), e.productId]).then(() => {
                        log('.');
                        client.release();
                    });
                });
            });
        }

        const concurrencyCount = Math.max(1, config.db.poolConfig.max - 5);

        const source: Rx.Observable<any> = createIngredientObservable()
            .map(mapIngredient)
            .flatMap(searchIngredientInProducts, concurrencyCount)
            .reduce(reduceSearchResults, {})
            .flatMap(mapDictionaryToArray)
            .flatMap(updateProducts, concurrencyCount);

        return new Promise((resolve) => {
            source.subscribe((data) => {
                // on next
            }, (err) => {
                console.log('Error on rx chain');
                console.log(err);
            }, () => {
                // on complete
                resolve();
            });
        });
    }
}

export class exportProducts extends TaskExport {
    sourceJsonDocuments = {
        typeName: 'product',
        order: 'ean'
    };
    targetMongo = {
        // url: 'mongodb://localhost:27017/food-base',
        url: 'mongodb://heroku_qsjg9m7p:jklhg9edv91jg58aeah2shr4jk@ds055742.mlab.com:55742/heroku_qsjg9m7p',
        collectionName: 'products',
        autoRemove: true
    };
}
