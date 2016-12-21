`use strict`;

import {config as configDotEnv} from 'dotenv';

configDotEnv({silent:true});

export const config = {
    mocha: process.env.MOCHA || false,
    webapi: {
        httpServer: {
            port: process.env.DC_WEBAPI_HTTP_PORT || 3003,
            host: process.env.DC_WEBAPI_HTTP_SERVER || 'localhost'
        },
        socketServer: {
            port: process.env.DC_WEBAPI_SOCKET_PORT || 3333,
            url: process.env.DC_WEBAPI_SOCKET_SERVER || 'http://localhost:3333/ns'
        }
    },
    db: {
        connectionUrl: process.env.DATABASE_URL || 'postgres://jbl-dc:jbl-dc@localhost/jbl-dc',
        schema: process.env.MOCHA ? 'testrepo' : 'repo',
        poolConfig: {
            ssl: process.env.DATABASE_SSL || false,
            max: process.env.DATABASE_POOL_MAX || 90,
            idleTimeoutMillis: 5000,
            host: process.env.DATABASE_HOST || 'localhost',
            user: process.env.DATABASE_USER || 'jbl-dc',
            password: process.env.DATABASE_PASSWORD || 'jbl-dc',
            database: process.env.DATABASE_NAME || 'jbl-dc'
        },
        driverOptions: {
            poolIdleTimeout: 2000
        }
    },
    logger: {
        enabled: !parseInt(process.env.LOGGER_SILENT)
    }
};
