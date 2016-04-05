'use strict';

const rfr = require('rfr');
const DocumentDAO = rfr('./libs/repo/DocumentDAO');

module.exports = {
    getDocuments: function (request, reply)
    {
        var query = {
            type: request.params.type,
            blacklist: request.payload.blacklist,
            whitelist: request.payload.whitelist
        };
        return DocumentDAO.getJsonDocuments(query).then((result)=>
        {
            reply({data: result});
        });
    },
    getTypes: function (request, reply)
    {
        return DocumentDAO.getJsonDocumentsTypes().then((result)=>
        {
            reply({data: result});
        });
    }
};
