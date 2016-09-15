'use strict';

const rfr = require('rfr');
const _ = require('lodash');
const pg = require('pg-rxjs');
const config = rfr('config');
const db = rfr('libs/db');

const pool = pg.Pool(config.db.connectionUrl, {debug: false});

function prepareTsquery(query, skipSpecialCharacters)
{
    query = query || '';
    if (!skipSpecialCharacters) {
        query = query.replace(/\W/g, ' ');
    }
    query = query.replace(/[ ]+/g, ' ');
    query = query.trim();
    query = query.replace(/[ ]+/g, ' & ');
    return query;
}

var ingredientsQuery = `SELECT * FROM repo.document_json WHERE type = 'vitalia' AND body->>'code' != 'E952'`;
pool.stream(ingredientsQuery).map((record)=>
{
    record.body.searchVector = _.join(record.body.names, ', ');
    return record.body;
}).flatMap((ingredient)=>
{
    var productSearchIngredientsQuery =
        `SELECT *
         FROM repo.document_json 
         WHERE type = 'alma24' AND
         ((body->>'ingredients')::text)::tsvector @@ $1 LIMIT 5`;

    // todo
    // search via like %E33% FIRST

    // todo performe full text search
    // ((body->>'ingredients')::text)::tsvector @@ ${to_tsquery($1)}
    // protect left side from chars: [':']

    return db.query(productSearchIngredientsQuery, [prepareTsquery(ingredient.searchVector)]).then((products)=>
    {
        _.map(products, function (product)
        {
            // now update each pro
            console.log(product.id);
        });
        return true;
    });
    // query postgresql
}).reduce((acc)=>
{
    return acc;
}, {a: 1}).subscribe(
    (output, res)=>
    {
        console.log('finished up');
    }
);

// var q = `SELECT body->>'ean' as ean, body->>'ingredients' as ingredients FROM repo.document_json WHERE type = 'alma24' LIMIT 10`;
// pool.stream(q).map(function (record)
//     {
//         console.log(JSON.stringify(record, null, 4));
//     })
//     .subscribe();
