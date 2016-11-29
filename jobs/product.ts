'use strict';

import {ITaskDownload} from "../libs/downloader";
import {ITaskExtract} from "../libs/extractor";
import {ITaskScript} from "../libs/launcher";
import {ITaskExport} from "../libs/exporter";

import * as Rx from 'rxjs';
import * as _ from 'lodash';
import promise = require('bluebird');
import config = require('../config');
import db = require('../libs/db');
import * as pg from 'pg';
import pgrx = require('pg-rxjs');
import repo = require("../libs/repo");

const baseUrl = 'https://ezakupy.tesco.pl/groceries/pl-PL/shop/warzywa-owoce/warzywa/Cat0000';

const tescoLinksSourcesUrls = {
    favorites: _.map(['bounty', 'hit', 'pudliszki', 'pudliszki&page=2',
            'kabanosy', 'kabanosy&page=2', 'winiary', 'winiary&page=2', 'winiary&page=3', 'winiary&page=4',
            'winiary&page=5', 'winiary&page=6', 'lisner', 'lisner&page=2', 'lisner&page=3',
            'lisner&page=4', 'kinder', 'roleski', 'wawel', 'wawel&page=2', 'wawel&page=3',
            'mlekovita', 'mlekovita&page=2', 'mlekovita&page=3', 'łosoś',
            'łosoś&page=2', 'piątnica', 'piątnica&page=2', 'masło',
            'kabanosy&page=3', 'kabanosy&page=4'],
        item => 'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=' + item),
    range: ()=> {
        return _.map(_.range(5309, 5764, 1), k=>baseUrl + k);
    }
};

export const download: ITaskDownload = {
    type: 'download',
    name: 'tescoLinks',
    autoRemove: true,
    urls: tescoLinksSourcesUrls.favorites
};

export const extract: ITaskExtract = {
    type: 'extract',
    sourceHttpDocuments: {
        name: 'tescoLinks'
    },
    targetJsonDocuments: {
        typeName: 'tescoLinks',
        autoRemove: true
    },
    map: {
        count: {
            selector: '.pagination-component p.results-count strong:last-child',
            process: /[0-9]{0,5}/,
            singular: true
        },
        links: {
            attribute: 'href',
            selector: 'a.product-tile--title.product-tile--browsable'
        }
    },
    process: (extracted, doc)=> {
        extracted.url = doc.url;
        return extracted
    }
};

export const save: ITaskScript = {
    type: 'script',
    script: (data)=> {
        return repo.removeJsonDocuments('tescoProductsLinks').then(()=> {
            return repo.getJsonDocuments({type: 'tescoLinks'}).then((d)=> {
                var linksSet = _.reduce(d.results, (acc, item)=> {
                    return acc.concat(_.get(item, 'body.links'));
                }, []);
                return repo.saveJsonDocument('tescoProductsLinks', {links: linksSet});
            });
        });
    }
};

export const downloadProducts: ITaskDownload = {
    type: 'download',
    name: 'tescoProduct',
    autoRemove: true,
    urls: ()=> {
        return repo.getJsonDocuments({type: 'tescoProductsLinks'}).then((tescoProductsLinks)=> {
            var links = _.get(tescoProductsLinks, 'results[0].body.links', []);
            return _.map(links, identity => 'https://ezakupy.tesco.pl/' + identity);
        });
    }
};

export const extractProducts: ITaskExtract = {
    type: 'extract',
    sourceHttpDocuments: {
        name: 'tescoProduct'
    },
    targetJsonDocuments: {
        typeName: 'product',
        autoRemove: true
    },
    map: {
        name: {
            singular: true,
            selector: 'h1.product-title'
        },
        imgAddress: {
            singular: true,
            selector: 'img.product-image',
            attribute: 'src'
        },
        description: {
            singular: true,
            selector: 'h4.itemHeader:contains("Opis produktu") ~ p'
        },
        ingredients: {
            singular: true,
            selector: '.brand-bank--brand-info .groupItem h3:contains("Składniki") ~ div.longTextItems>p'
        },
        ean: {
            singular: true,
            selector: 'img.product-image',
            attribute: 'src',
            process: /[0-9]{13}/
        }
    },
    process: function (extracted, doc) {
        extracted.components = [];
        extracted.ean = extracted.ean || doc.url;
        return extracted;
    }
};

export const produce: ITaskScript = {
    type: 'script',
    script: ()=> {
        return new promise((resolve, reject) => {

            const queryFetchIngredients = `SELECT body FROM repo.document_json WHERE type = 'ingredient'`;

            const querySearchingredientsInProducts = `SELECT id, body FROM repo.document_json 
                WHERE type = 'product' AND to_tsvector(body->>'ingredients') @@ to_tsquery($1)`;

            const queryUpdateProducts = 'UPDATE repo.document_json SET body=$1 WHERE id=$2';

            // move to regular rxjs
            const pool = pgrx.Pool(config.db.connectionUrl);
            pool.stream(queryFetchIngredients)
                .map((ingredient)=> {
                    return {
                        data: {
                            code: ingredient.body.code,
                            name: ingredient.body.name,
                            rating: ingredient.body.rating,
                        },
                        searchVector: _.chain(ingredient.body.names)
                            .map((name) => {
                                //TODO: simplify regex / +/g
                                return name.replace(/[ ]+/g, ' & ');
                            }).join(' | ').value()
                    }
                })
                .flatMap((component) => {
                    return db.query(querySearchingredientsInProducts, [component.searchVector]).then((products)=> {
                        process.stdout.write('.');
                        return {component: component.data, products: _.map(products, 'id')};
                    }).catch(() => {
                        console.log('error');
                    });
                })
                .reduce((acc, x)=> {
                    _.forEach(x.products, (p)=> {
                        if (acc[p]) {
                            acc[p].push(x.component);
                        } else {
                            acc[p] = [x.component];
                        }
                        process.stdout.write('/');
                    });
                    return acc;
                }, {})
                .flatMap((dictionary)=> {
                    console.log(dictionary);
                    console.log('ok');
                    return _.map(dictionary, (components, productId) => {
                        return {productId: productId, components: components};
                    });
                })
                .flatMap((e)=> {
                    return db.query('SELECT body FROM repo.document_json WHERE id=$1',
                        [parseInt(e.productId)]).then((res)=> {
                        res[0].body.components = e.components;
                        process.stdout.write('+');
                        return db.query(queryUpdateProducts, [JSON.stringify(res[0].body), e.productId]).then(() => {
                            process.stdout.write('~');
                        });
                    });
                })
                .subscribe(function () {
                }, function (error) {
                    console.log('rx pipeline error');
                    console.log(error);
                }, resolve);
        });
    }
};

export const produce2: ITaskScript = {
    type: 'script',
    script: () => {

        const pool = db.getPool();

        function createIngredientObservable(): Rx.Observable<any> {
            const queryFetchIngredients = `SELECT body FROM repo.document_json WHERE type = 'ingredient'`;

            return Rx.Observable.create((subscriber) => {
                pool.connect().then((client: pg.Client) => {
                    const stream: pg.Query = client.query(queryFetchIngredients, () => {
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
            const querySearchIngredientsInProducts = `SELECT id, body FROM repo.document_json 
                WHERE type = 'product' AND to_tsvector(body->>'ingredients') @@ to_tsquery($1)`;

            console.log('pool/search');
            return pool.connect().then((client) => {
                console.log('client');
                return client.query(querySearchIngredientsInProducts, [ingredient.searchVector]).then((products) => {
                    console.log('done');
                    client.release();
                    return {ingredient: ingredient.meta, products: _.map(products.rows, 'id')};
                }).catch((err) => {
                    console.log('Some error');
                    console.log(err);
                    client.release();
                });
            }).catch((err) => {
                console.log('SQL ERROR');
                console.log(err);
            });
        }

        const source = createIngredientObservable().map(mapIngredient).flatMap(searchIngredientInProducts,50);

        return new promise((resolve) => {
            source.subscribe((data) => {
                process.stdout.write('.');
                console.log(data);
            }, () => {

            }, () => {
                resolve();
            });
        });

    }
};

export const exportProducts: ITaskExport = {
    type: 'export',
    sourceJsonDocuments: {
        typeName: 'product',
        order: 'ean'
    },
    targetMongo: {
        url: 'mongodb://localhost:27017/food-scanner',
        // url: 'mongodb://heroku_qsjg9m7p:jklhg9edv91jg58aeah2shr4jk@ds055742.mlab.com:55742/heroku_qsjg9m7p',
        collectionName: 'products',
        autoRemove: true
    }
};
