`use strict`;

import {config as configDotEnv} from 'dotenv';

configDotEnv({silent:true});

export const config = {
    webapi: {
        httpServer: {
            port: process.env.DC_WEBAPI_HTTP_PORT || 3003,
            url: process.env.DC_WEBAPI_HTTP_SERVER || 'http://localhost:3003'
        },
        socketServer: {
            port: process.env.DC_WEBAPI_SOCKET_PORT || 3333,
            url: process.env.DC_WEBAPI_SOCKET_SERVER || 'http://localhost:3333/ns'
        }
    },
    db: {
        connectionUrl: process.env.DATABASE_URL || 'postgres://jbl-dc:jbl-dc@localhost/jbl-dc',
        schema: 'repo',
        schemaTest: 'repo-test',
        poolConfig: {
            ssl: true,
            max: process.env.DC_POSTGRES_POOL_MAX || 90,
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
