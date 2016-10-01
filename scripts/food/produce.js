'use strict';

const rfr = require('rfr');
const _ = require('lodash');
const pg = require('pg-rxjs');
const config = rfr('config');
const db = rfr('libs/db');
const Promise = require('bluebird');

const pool = pg.Pool(config.db.connectionUrl, { debug: false });

const queryFetchIngredients = `SELECT * FROM repo.document_json WHERE type = 'ingredient'`;

const querySearchingredientsInProducts = `SELECT id, body FROM repo.document_json
            WHERE type = 'product' AND to_tsvector(body->>'ingredients') @@ to_tsquery($1)`;

const queryUpdateProducts = 'UPDATE repo.document_json SET body=$1 WHERE id=$2';

pool.stream(queryFetchIngredients)
    .map((ingredient)=> {
        ingredient.body.searchVector = _.chain(ingredient.body.names)
            .map((name) => {
                return name.replace(/[ ]+/g, ' & ')
            })
            .join(' | ')
            .value();
        return ingredient.body;
    })
    .flatMap((component) => {
        return db.query(querySearchingredientsInProducts, [component.searchVector]).then((products)=> {
            process.stdout.write('.');
            return { component: component, products: _.map(products, 'id') };
        });
    })
    .reduce((acc, x)=> {
        _.forEach(x.products, (p)=> {
            if (acc[p]) {
                acc[p].push(x.component);
            } else {
                acc[p] = [x.component];
            }
        });
        return acc;
    }, {})
    .flatMap((dictionary)=> {
        return _.map(dictionary, function (components, productId) {
            return { productId: productId, components: components };
        });
    })
    .flatMap((e)=> {
        return db.query('SELECT body FROM repo.document_json WHERE id=$1', [parseInt(e.productId)]).then((res)=> {
            res[0].body.components = e.components;
            return db.query(queryUpdateProducts, [JSON.stringify(res[0].body), e.productId]);
        });
    })
    .subscribe(()=> {}, () => {},
        (data) => {
            console.log('Complete');
        }
    );
