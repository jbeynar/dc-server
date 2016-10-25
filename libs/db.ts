'use strict';

import pg = require('pg');
import promise = require('bluebird');
import config = require('../config');

var highlighStart = '\x1b[31m';
var highlightEnd = '\x1b[0m';

pg.defaults.poolIdleTimeout = config.db.driverOptions.poolIdleTimeout;

export function connect(connectionUrl?) {
    connectionUrl = connectionUrl || config.db.connectionUrl;
    var pgConnect : any = promise.promisify(pg.connect, pg);
    return pgConnect(connectionUrl).then(function (connection)
    {
        var client = connection[0];
        return {
            query: promise.promisify(client.query, client),
            done: connection[1]
        };
    });
}

export function exceptionHandler(err) {
    console.error(highlighStart + 'SQL ' + err.toString());
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
        }).finally(client.done);
    }).catch(exceptionHandler);
}

