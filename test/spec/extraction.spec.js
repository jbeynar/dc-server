'use strict';

const expect = require('chai').expect;
const rfr = require('rfr');
const utils = rfr('test/utils');

describe('Extraction library', () =>
{
    var htmlDocument;
    const extraction = rfr('libs/extraction');

    before(function ()
    {
        return utils.getFixture('document1.html').then((fixture)=>
        {
            htmlDocument = fixture;
        });
    });

    it('Rejects with appropriate error when called with empty document', () =>
    {
        return extraction.extract(undefined, {}).catch((err)=>
        {
            expect(err.message.toString()).to.equal(extraction.errorCodes.docEmpty);
        });
    });

    it('Rejects with appropriate error when called with map of non-object type', () =>
    {
        return extraction.extract(htmlDocument, 'map').catch((err)=>
        {
            expect(err.message.toString()).to.equal(extraction.errorCodes.mapInvalid);
        });
    });

    it('Pull out element based on simple map notation', () =>
    {
        var expected = {
            title: 'Employee list'
        };
        return extraction.extract(htmlDocument, {title: 'h1'}).then((data)=>
        {
            expect(data).to.eql(expected);
        });
    });

    it('Pull out element based on objective map notation', () =>
    {
        var mapping = {
            title: {
                selector: 'h1'
            }
        };
        var expected = {
            title: 'Employee list'
        };
        return extraction.extract(htmlDocument, mapping).then((data)=>
        {
            expect(data).to.eql(expected);
        });
    });

    it('Pull out element and apply synchronous process function', () =>
    {
        var mapping = {
            title: {
                selector: 'h1',
                process: function (element)
                {
                    return element.toUpperCase();
                }
            }
        };
        var expected = {
            title: 'EMPLOYEE LIST'
        };
        return extraction.extract(htmlDocument, mapping).then((data)=>
        {
            expect(data).to.eql(expected);
        });
    });

    it('Should not crash whole extraction if one process function fail', ()=>
    {
        var mapping = {
            title: {
                selector: 'h1',
                process: function (element)
                {
                    return element.match(/\((.*)\)/)[2];
                }
            },
            subtitle: 'h2'
        };
        var expected = {
            title: 'Employee list',
            subtitle: 'An xyz company'
        };

        return extraction.extract(htmlDocument, mapping).then((data)=>
        {
            expect(data).to.eql(expected);
        });
    });

    it('Should only extract elements passed as props param', ()=>
    {
        var mapping = {
            title: 'h1',
            subtitle: 'h4',
            leading: 'p',
            author: 'strong'
        };

        var expected = {
            title: 'Employee list',
            author: 'Authored by jbeynar'
        };

        return extraction.extract(htmlDocument, mapping, ['title', 'author']).then((data)=>
        {
            expect(data).to.eql(expected);
        });
    });

});
