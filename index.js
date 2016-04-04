'use strict';

const Hapi = require('hapi');
const documentHandler = require('./api/document.handler');

const server = new Hapi.Server();
server.connection({
    port: 3000,
    routes: {
        cors: true
    }
});

server.route({
    method: 'POST',
    path: '/document/json',
    handler: documentHandler.getDocuments
});

server.start((err) =>
{
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
