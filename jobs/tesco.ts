'use strict';

import * as Rx from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as pg from 'pg';
import * as db from '../libs/db';
import * as repo from '../libs/repo';
import {config} from '../config';
import {TaskDownload, TaskExtract, TaskScript, TaskExport} from "../shared/typings";
import {log} from "../libs/logger";

const baseUrl = 'https://ezakupy.tesco.pl/groceries/pl-PL/shop/art.-spozywcze/all?page=';

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
        return _.map(_.range(1, 243, 1), k=>baseUrl + k);
    }
};

export class download extends TaskDownload {
    name = 'tescoLinks';
    autoRemove = true;

    urls() {
        return tescoLinksSourcesUrls.range();
    }
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'tescoLinks'
    };
    targetJsonDocuments = {
        typeName: 'tescoLinks',
        autoRemove: true
    };
    map = {
        count: {
            selector: '.pagination-component p.results-count strong:last-child',
            process: /[0-9]{0,5}/,
            singular: true
        },
        links: {
            attribute: 'href',
            selector: 'a.product-tile--title.product-tile--browsable'
        }
    };

    process(extracted, doc) {
        extracted.url = doc.url;
        return extracted
    };
}

export class save extends TaskScript {
    script() {
        return repo.removeJsonDocuments('tescoProductsLinks').then(()=> {
            return repo.getJsonDocuments({type: 'tescoLinks'}).then((d)=> {
                const linksSet = _.reduce(d.results, (acc, item)=> {
                    return acc.concat(_.get(item, 'body.links'));
                }, []);
                return repo.saveJsonDocument('tescoProductsLinks', {links: linksSet});
            });
        });
    }
}

export class downloadProducts extends TaskDownload {
    name = 'tescoProduct';
    autoRemove = true;

    urls() {
        return repo.getJsonDocuments({type: 'tescoProductsLinks'}).then((tescoProductsLinks)=> {
            const links = _.get(tescoProductsLinks, 'results[0].body.links', []);
            return _.map(links, identity => 'https://ezakupy.tesco.pl/' + identity);
        });
    }
}

export class extractProducts extends TaskExtract {
    sourceHttpDocuments = {
        name: 'tescoProduct'
    };
    targetJsonDocuments = {
        typeName: 'product',
        autoRemove: true
    };
    map = {
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
    };

    process(extracted, doc) {
        extracted.components = [];
        extracted.ean = extracted.ean || doc.url;
        return extracted;
    };
}

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
        // url: 'mongodb://localhost:27017/food-scanner',
        url: 'mongodb://heroku_qsjg9m7p:jklhg9edv91jg58aeah2shr4jk@ds055742.mlab.com:55742/heroku_qsjg9m7p',
        collectionName: 'products',
        autoRemove: true
    };
}
