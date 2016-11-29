`use strict`;

module.exports = {
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
