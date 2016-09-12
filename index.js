'use strict';

const Hapi = require('hapi');
const documentJsonHandler = require('./api/documentJson.handler');

const server = new Hapi.Server();
server.connection({
    port: 3003,
    routes: {
        cors: true
    }
});

server.route({
    method: 'POST',
    path: '/document/json/{type}',
    handler: documentJsonHandler.getDocuments
});

server.route({
    method: 'POST',
    path: '/document/json/types',
    handler: documentJsonHandler.getTypes
});

server.start((err) =>
{
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
