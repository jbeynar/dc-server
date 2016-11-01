'use strict';

const Hapi = require('hapi');
const repo = require('./libs/repo');

const api = {
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
    removeHttpDocumentsByHost: function (request, reply) {
        return repo.removeHttpDocumentsByHost(request.params.host).then((result)=> {
            reply({ data: result });
        });
    }
};

const server = new Hapi.Server();
server.connection({ port: 3003, routes: { cors: true } });
server.route({ method: 'GET', path: '/repo/json/types', handler: api.getJsonTypes });
server.route({ method: 'POST', path: '/repo/json/{type}', handler: api.getJsonDocuments });
server.route({ method: 'DELETE', path: '/repo/json/{type}', handler: api.removeJsonType });
server.route({ method: 'GET', path: '/repo/http/summary', handler: api.getHttpDocumentsSummary });
server.route({ method: 'DELETE', path: '/repo/http/{host}', handler: api.removeHttpDocumentsByHost });

server.start((err) =>
{
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
