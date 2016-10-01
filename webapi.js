'use strict';

const Hapi = require('hapi');
const rfr = require('rfr');
const repo = rfr('./libs/repo');

const api = {
    getDocuments: function (request, reply) {
        var query = {
            type: request.params.type,
            blacklist: request.payload.blacklist,
            whitelist: request.payload.whitelist
        };
        return repo.getJsonDocuments(query).then((result)=> {
            reply({ data: result });
        });
    },
    getTypes: function (request, reply) {
        return repo.getJsonDocumentsTypes().then((result)=> {
            reply({ data: result });
        });
    },
    removeType: function (request, reply) {
        return repo.removeJsonDocuments(request.params.type).then((result)=> {
            reply({ data: result });
        });
    }
};

const server = new Hapi.Server();
server.connection({
    port: 3003,
    routes: {
        cors: true
    }
});
server.route({
    method: 'GET',
    path: '/repo/json/types',
    handler: api.getTypes
});
server.route({
    method: 'POST',
    path: '/repo/json/{type}',
    handler: api.getDocuments
});
server.route({
    method: 'DELETE',
    path: '/repo/json/{type}',
    handler: api.removeType
});

server.start((err) =>
{
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
