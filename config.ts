`use strict`;

import {config as configDotEnv} from 'dotenv';

configDotEnv();

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
        connectionUrl: process.env.DC_POSTGRES_URL || 'postgres://jbl-dc:jbl-dc@localhost/jbl-dc',
        schema: 'repo',
        schemaTest: 'repo-test',
        poolConfig: {
            max: process.env.DC_POSTGRES_POOL_MAX || 90,
            idleTimeoutMillis: 5000,
            host: 'localhost',
            user: 'jbl-dc',
            password: 'jbl-dc',
            database: 'jbl-dc'
        },
        driverOptions: {
            poolIdleTimeout: 2000
        }
    },
    logger: {
        enabled: !parseInt(process.env.LOGGER_SILENT)
    }
};
