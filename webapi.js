'use strict';
// const Hapi = require('hapi');
const repo = require('./libs/repo');
const launch = require('./libs/launch');
const config_1 = require('./config');
const _ = require('lodash');
const hapi_1 = require('hapi');
const httpServerPort = config_1.config.webapi.httpServer.port;
const socketPort = config_1.config.webapi.socketServer.port;
const RepoApi = {
    getJsonDocuments: {
        method: 'POST', path: '/repo/json/{type}', handler: function (request, reply) {
            var query = {
                type: request.params.type,
                blacklist: request.payload.blacklist,
                whitelist: request.payload.whitelist
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
        method: 'GET', path: '/jobs/', handler: function (request, reply) {
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
    server.connection({ port: httpServerPort, routes: { cors: true } });
    _.forEach(RepoApi, (route) => {
        server.route({ method: route.method, path: route.path, handler: route.handler });
    });
    _.forEach(LaunchApi, (route) => {
        server.route({ method: route.method, path: route.path, handler: route.handler });
    });
    server.start((err) => {
        if (err) {
            throw err;
        }
        console.log('Http server running at:', server.info.uri);
    });
}
function setupSocketServer() {
    const io = require('socket.io')(socketPort);
    const ns = io.of('/ns');
    ns.on('connection', (conn) => {
        console.log('Sockets client connected');
        conn.on('progressNotification', (msg) => {
            console.log('progressNotification');
            console.log('progressNotification', JSON.stringify(msg));
            ns.emit('progressNotification', msg);
        });
    });
    console.log(`Sockets server running at ${socketPort}`);
}
setupHttpServer();
setupSocketServer();
//# sourceMappingURL=webapi.js.map