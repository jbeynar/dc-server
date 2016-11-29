'use strict';

import * as pg from 'pg';
import * as Promise from 'bluebird';
import config = require('../config');
import * as _ from 'lodash';

var highlightStart = '\x1b[31m';
var highlightEnd = '\x1b[0m';
var pool = new pg.Pool(config.db.poolConfig);

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

export function getPool(){
    return pool;
}
