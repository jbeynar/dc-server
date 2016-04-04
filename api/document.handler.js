'use strict';

const rfr = require('rfr');
const DocumentDAO = rfr('./libs/repo/DocumentDAO');

module.exports = {
    getDocuments: function (request, reply)
    {
        return DocumentDAO.getJsonDocuments(request.payload.whitelist, request.payload.blacklist).then(function (result)
        {
            reply({data:result});
        });
    }
};
