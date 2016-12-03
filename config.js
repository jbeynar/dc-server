"use strict";
"use strict";
exports.config = {
    webapi: {
        httpServer: {
            port: 3003,
            url: 'http://localhost:3003'
        },
        socketServer: {
            port: 3333,
            url: 'http://localhost:3333/ns'
        }
    },
    db: {
        connectionUrl: 'postgres://jbl-dc:jbl-dc@localhost/jbl-dc',
        poolConfig: {
            max: 90,
            idleTimeoutMillis: 5000,
            host: 'localhost',
            user: 'jbl-dc',
            password: 'jbl-dc',
            database: 'jbl-dc'
        },
        driverOptions: {
            poolIdleTimeout: 2000
        }
    }
};
