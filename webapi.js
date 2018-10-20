'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const repo = require('./libs/repo');
const launch = require('./libs/launch');
const config_1 = require("./config");
const _ = require("lodash");
const hapi_1 = require("hapi");
const logger_1 = require("./libs/logger");
const RepoApi = {
    getJsonDocuments: {
        method: 'POST', path: '/repo/json/{type}', handler: function (request, reply) {
            const payload = request.payload;
            const query = {
                type: request.params.type,
                blacklist: _.get(payload, 'blacklist', []),
                whitelist: _.get(payload, 'whitelist', []),
                from: _.get(payload, 'from', undefined),
                size: _.get(payload, 'size', undefined),
            };
            return repo.getJsonDocuments(query).then((result) => {
                reply({ data: result });
            });
        }
    },
    getJsonTypes: {
        method: 'GET', path: '/repo/json/types', handler: function (request, reply) {
            return repo.getJsonDocumentsTypes().then((result) => {
                reply({ data: result });
            });
        }
    },
    removeJsonType: {
        method: 'DELETE', path: '/repo/json/{type}', handler: function (request, reply) {
            return repo.removeJsonDocuments(request.params.type).then((result) => {
                reply({ data: result });
            });
        }
    },
    getHttpDocument: {
        method: 'GET', path: '/repo/http/{type}/{offset}', handler: function (request, reply) {
            return repo.getHttpDocument(request.params.type, request.params.offset).then((result) => {
                reply({ data: result });
            });
        }
    },
    getHttpDocumentsSummary: {
        method: 'GET', path: '/repo/http/summary', handler: function (request, reply) {
            return repo.getHttpDocumentsSummary().then((result) => {
                reply({ data: result });
            });
        }
    },
    removeHttpDocumentsByName: {
        method: 'DELETE', path: '/repo/http/{name}', handler: function (request, reply) {
            return repo.removeHttpDocumentsByName(request.params.name).then((result) => {
                reply({ data: result });
            });
        }
    }
};
const LaunchApi = {
    getJobs: {
        method: 'GET', path: '/jobs', handler: function (request, reply) {
            return launch.getJobs().then((result) => {
                reply({ data: result });
            });
        }
    },
    getTasks: {
        method: 'GET', path: '/jobs/tasks', handler: function (request, reply) {
            return launch.getTasks().then((result) => {
                reply({ data: result });
            });
        }
    },
    run: {
        method: 'POST', path: '/run/{job}/{task?}', handler: function (request, reply) {
            let tasks;
            if (request.params.task) {
                tasks = [request.params.task];
            }
            launch.run(request.params.job, tasks);
            return reply();
        }
    }
};
function setupHttpServer() {
    const server = new hapi_1.Server();
    const options = {
        port: config_1.config.webapi.httpServer.port,
        routes: { cors: { origin: ['*'] } }
    };
    server.connection(options);
    _.forEach(RepoApi, (route) => {
        server.route({ method: route.method, path: route.path, handler: route.handler });
    });
    _.forEach(LaunchApi, (route) => {
        server.route({ method: route.method, path: route.path, handler: route.handler });
    });
    return server.start((err) => {
        if (err) {
            logger_1.error(err);
            throw err;
        }
        logger_1.log(`JBL Data Center Web API starts at: ${server.info.uri}`, 1);
    });
}
function setupSocketServer() {
    const io = require('socket.io')(config_1.config.webapi.socketServer.port);
    const ns = io.of('/ns');
    const forwardEvents = [
        'progressNotification',
        'logger'
    ];
    ns.on('connection', (conn) => {
        console.log('Sockets client connected');
        _.each(forwardEvents, event => conn.on(event, msg => ns.emit(event, msg)));
    });
    logger_1.log(`JBL Data Center Sockets server starts at ${config_1.config.webapi.socketServer.url}`, 1);
}
if (!config_1.config.mocha && _.get(config_1.config, 'webapi.socketServer.enable')) {
    setupSocketServer();
}
setupHttpServer();
//# sourceMappingURL=webapi.js.map