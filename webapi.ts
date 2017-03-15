'use strict';

const repo = require('./libs/repo');
const launch = require('./libs/launch');
import {config} from './config';

import * as _ from 'lodash';
import {Server} from 'hapi';
import {error, log} from "./libs/logger";
import {IJsonSearchConfig} from "./shared/typings";

const RepoApi = {
    getJsonDocuments: {
        method: 'POST', path: '/repo/json/{type}', handler: function (request, reply) {
            const payload = request.payload;
            const query: IJsonSearchConfig = {
                type: request.params.type,
                blacklist: _.get(payload, 'blacklist', []),
                whitelist: _.get(payload, 'whitelist', []),
                from: _.get(payload, 'from', undefined),
                size: _.get(payload, 'size', undefined),
            };
            return repo.getJsonDocuments(query).then((result) => {
                reply({data: result});
            });
        }
    },
    getJsonTypes: {
        method: 'GET', path: '/repo/json/types', handler: function (request, reply) {
            return repo.getJsonDocumentsTypes().then((result) => {
                reply({data: result});
            })
        }
    },
    removeJsonType: {
        method: 'DELETE', path: '/repo/json/{type}', handler: function (request, reply) {
            return repo.removeJsonDocuments(request.params.type).then((result) => {
                reply({data: result});
            })
        }
    },
    getHttpDocument: {
        method: 'GET', path: '/repo/http/{type}/{offset}', handler: function (request, reply) {
            return repo.getHttpDocument(request.params.type, request.params.offset).then((result) => {
                reply({data: result});
            })
        }
    },
    getHttpDocumentsSummary: {
        method: 'GET', path: '/repo/http/summary', handler: function (request, reply) {
            return repo.getHttpDocumentsSummary().then((result) => {
                reply({data: result});
            })
        }
    },
    removeHttpDocumentsByName: {
        method: 'DELETE', path: '/repo/http/{name}', handler: function (request, reply) {
            return repo.removeHttpDocumentsByName(request.params.name).then((result) => {
                reply({data: result});
            });
        }
    }
};

const LaunchApi = {
    getJobs: {
        method: 'GET', path: '/jobs/', handler: function (request, reply) {
            return launch.getJobs().then((result) => {
                reply({data: result});
            });
        }
    },
    getTasks: {
        method: 'GET', path: '/jobs/tasks', handler: function (request, reply) {
            return launch.getTasks().then((result) => {
                reply({data: result});
            });
        }
    },
    run: {
        method: 'POST', path: '/run/{job}/{task?}', handler: function (request, reply) {
            let tasks;
            if (request.params.task) {
                tasks = [request.params.task]
            }
            launch.run(request.params.job, tasks);
            return reply();
        }
    }
};

function setupHttpServer() {
    const server = new Server();

    server.connection({port: config.webapi.httpServer.port, routes: {cors: true}});

    _.forEach(RepoApi, (route) => {
        server.route({method: route.method, path: route.path, handler: route.handler});
    });

    _.forEach(LaunchApi, (route) => {
        server.route({method: route.method, path: route.path, handler: route.handler});
    });

    return server.start((err) => {
        if (err) {
            error(err);
            throw err;
        }
        log(`DC WEB API starts at: ${server.info.uri}`, 1);
    });
}

function setupSocketServer() {
    const io = require('socket.io')(config.webapi.socketServer.port);
    const ns = io.of('/ns');
    const forwardEvents = [
        'progressNotification',
        'logger'
    ];

    ns.on('connection', (conn) => {
        console.log('Sockets client connected');
        _.each(forwardEvents, event => conn.on(event, msg => ns.emit(event, msg)));
    });

    log(`DC Sockets server starts at ${config.webapi.socketServer.url}`, 1);
}

if (!config.mocha) {
    setupSocketServer();
}

setupHttpServer();
