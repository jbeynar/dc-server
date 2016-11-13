'use strict';

import pg = require('pg');
import config = require('../config');

var highlightStart = '\x1b[31m';
var highlightEnd = '\x1b[0m';

pg.defaults.poolIdleTimeout = config.db.driverOptions.poolIdleTimeout;

export function connect(connectionUrl?) {
    connectionUrl = connectionUrl || config.db.connectionUrl;
    return pg.connect(connectionUrl);
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

export function query(query : string, bindings? : string[]|number[]) {
    return connect().then((client)=>
    {
        return client.query(query, bindings).then((res)=>
        {
            return res.rows;
        });
    }).catch(exceptionHandler);
}

