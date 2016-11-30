'use strict';

const Hapi = require('hapi');
const repo = require('./libs/repo');
const launch = require('./libs/launch');

const RepoApi = {
    getJsonDocuments: function (request, reply) {
        var query = {
            type: request.params.type,
            blacklist: request.payload.blacklist,
            whitelist: request.payload.whitelist
        };
        return repo.getJsonDocuments(query).then((result)=> {
            reply({ data: result });
        });
    },
    getJsonTypes: function (request, reply) {
        return repo.getJsonDocumentsTypes().then((result)=> {
            reply({ data: result });
        });
    },
    removeJsonType: function (request, reply) {
        return repo.removeJsonDocuments(request.params.type).then((result)=> {
            reply({ data: result });
        });
    },
    getHttpDocumentsSummary: function (request, reply) {
        return repo.getHttpDocumentsSummary().then((result)=> {
            reply({ data: result });
        });
    },
    removeHttpDocumentsByName: function (request, reply) {
        return repo.removeHttpDocumentsByName(request.params.name).then((result)=> {
            reply({ data: result });
        });
    }
};

const LaunchApi = {
    getJobs: function (request, reply) {
        return launch.getJobs().then((result) => {
            reply({ data: result });
        });
    },
    getTasks: function (request, reply) {
        return launch.getTasks().then((result) => {
            reply({ data: result });
        });
    },
    run: function (request, reply) {
        let tasks;
        if (request.params.task) {
            tasks = [request.params.task]
        }
        launch.run(request.params.job, tasks);
        return reply();
    }
};

const server = new Hapi.Server();
server.connection({ port: 3003, routes: { cors: true } });

server.route({ method: 'GET', path: '/repo/json/types', handler: RepoApi.getJsonTypes });
server.route({ method: 'POST', path: '/repo/json/{type}', handler: RepoApi.getJsonDocuments });
server.route({ method: 'DELETE', path: '/repo/json/{type}', handler: RepoApi.removeJsonType });
server.route({ method: 'GET', path: '/repo/http/summary', handler: RepoApi.getHttpDocumentsSummary });
server.route({ method: 'DELETE', path: '/repo/http/{name}', handler: RepoApi.removeHttpDocumentsByName });

server.route({ method: 'GET', path: '/jobs', handler: LaunchApi.getJobs });
server.route({ method: 'GET', path: '/jobs/tasks', handler: LaunchApi.getTasks });
server.route({ method: 'POST', path: '/run/{job}/{task?}', handler: LaunchApi.run });

server.start((err) =>
{
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
