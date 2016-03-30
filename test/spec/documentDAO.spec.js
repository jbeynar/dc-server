'use strict';

const expect = require('chai').expect;
const rfr = require('rfr');
const utils = rfr('test/utils');

describe('DocumentDAO', () =>
{
    var htmlDocument;
    const DocumentDAO = rfr('libs/repo/DocumentDAO');

    before(function ()
    {
    });

    it('DocumentDAO.getDocuments retrive well-formated collection', (done) =>
    {
        DocumentDAO.getJsonDocuments().then(function (results)
        {
            console.log('well done', results);
            done();
        });
    });

});
