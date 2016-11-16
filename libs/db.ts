'use strict';

import * as pg from 'pg';
import config = require('../config');

var highlightStart = '\x1b[31m';
var highlightEnd = '\x1b[0m';

const poolConfig: pg.PoolConfig = {
    idleTimeoutMillis: config.db.driverOptions.poolIdleTimeout,
    host: 'localhost',
    user: 'jbl-dc',
    password: 'jbl-dc',
    database: 'jbl-dc',
};

export function connect(connectionUrl?) {
    connectionUrl = connectionUrl || config.db.connectionUrl;
    return new pg.Pool(poolConfig).connect();
}

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

export function query(query: string, bindings?: string[]|number[]): Promise<any[]> {
    return connect().then((client) => {
        return client.query(query, bindings).then((res) => {
            client.end();
            return res.rows;
        });
    }).catch(exceptionHandler);
}

