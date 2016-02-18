var pg = require('pg');
var Promise = require('bluebird');

pg.defaults.poolIdleTimeout = 2000;

module.exports = function db(connectionUrl)
{
    var pgConnect = Promise.promisify(pg.connect, pg);
    return pgConnect(connectionUrl).then(function (connection)
    {
        var client = connection[0];
        return {
            query: Promise.promisify(client.query, client),
            done: connection[1]
        };
    });
}
