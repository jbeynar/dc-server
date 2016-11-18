'use strict';

import * as pg from 'pg';
import * as Promise from 'bluebird';
import config = require('../config');
import * as _ from 'lodash';

var highlightStart = '\x1b[31m';
var highlightEnd = '\x1b[0m';

const poolConfig: pg.PoolConfig = {

    max: 90, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    host: 'localhost',
    user: 'jbl-dc',
    password: 'jbl-dc',
    database: 'jbl-dc',
};

var pool = new pg.Pool(poolConfig);

export function exceptionHandler(err) {
    console.error(highlightStart + 'SQL ' + err.toString());
    if (err.detail) {
        console.error('detail: ' + err.detail);
    }
    console.error('code: ' + err.code);
    console.error('position: ' + err.position);
    console.error('routine: ' + err.routine);
    console.log(err.stack, highlightEnd);
}

export function query(query: string, bindings?: string[]|number[]): Promise<any> {
    return new Promise((resolve) => {
        return pool.connect().then(function (client) {
            return client.query(query, bindings).then(function(res) {
                client.release();
                resolve(res.rows);
            });
        });
    }).catch(exceptionHandler);
}

