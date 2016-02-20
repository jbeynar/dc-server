'use strict';

const pg = require('pg');
const promise = require('bluebird');
const config = require('../config');

pg.defaults.poolIdleTimeout = config.db.driverOptions.poolIdleTimeout;

module.exports = function db(connectionUrl)
{
    connectionUrl = connectionUrl || config.db.connectionUrl;
    var pgConnect = promise.promisify(pg.connect, pg);
    return pgConnect(connectionUrl).then(function (connection)
    {
        var client = connection[0];
        return {
            query: promise.promisify(client.query, client),
            done: connection[1]
        };
    });
};
