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

    describe('Extracts DOM element inner text based on CSS selector mapping', ()=>
    {
        it('Rejects with appropriate error when called with empty document', () =>
        {
            return extraction.extract(undefined, {}).catch((err)=>
            {
                return expect(err.message.toString()).to.equal(extraction.errorCodes.docEmpty);
            });
        });

        it('Rejects with appropriate error when called with map of non-object type', () =>
        {
            return extraction.extract(htmlDocument, 'map').catch((err)=>
            {
                return expect(err.message.toString()).to.equal(extraction.errorCodes.mapInvalid);
            });
        });

        it('Pull out element based on simple map notation', () =>
        {
            var expected = {
                title: 'Employee list'
            };
            return extraction.extract(htmlDocument, {title: 'h1'}).then((data)=>
            {
                return expect(data).to.eql(expected);
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
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Run process function against extracted value', function ()
    {
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
                return expect(data).to.eql(expected);
            });
        });

        it('Pull out element and apply process as a regular expression given as string', () =>
        {
            var mapping = {
                title: {
                    selector: 'h2',
                    process: '[a-z0-9]{3}'
                }
            };
            var expected = {
                title: 'xyz'
            };
            return extraction.extract(htmlDocument, mapping).then((data)=>
            {
                return expect(data).to.eql(expected);
            });
        });

        it('Pull out element and apply process as a regular expression', () =>
        {
            var mapping = {
                title: {
                    selector: 'h2',
                    process: /[a-z0-9]{3}/
                }
            };
            var expected = {
                title: 'xyz'
            };
            return extraction.extract(htmlDocument, mapping).then((data)=>
            {
                return expect(data).to.eql(expected);
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
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Accept mapwhitelist', function ()
    {
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
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Extracts DOM element attribute value', function ()
    {
        it('Extract element attribute and apply process regexp given as string', ()=>
        {
            var mapping = {
                charset: {
                    selector: 'meta',
                    attribute: 'charset',
                    process: '\\d+'
                }
            };

            var expected = {
                charset: '8'
            };
            return extraction.extract(htmlDocument, mapping).then((data)=>
            {
                return expect(data).to.eql(expected);
            });
        });
        it('Extract element attribute and apply process regexp', ()=>
        {
            var mapping = {
                charset: {
                    selector: 'meta',
                    attribute: 'charset',
                    process: /\d+/
                }
            };

            var expected = {
                charset: '8'
            };
            return extraction.extract(htmlDocument, mapping).then((data)=>
            {
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Extracts array of values', ()=>
    {
        it('Take it how ya wanna take it', ()=>
        {
            var mapping = {
                heading: {
                    selector: 'th'
                }
            };
            var expected = {
                heading: ['ID', 'First name', 'Last name', 'Email']
            };
            return extraction.extractArray(htmlDocument, mapping).then((data)=>
            {
                return expect(data).to.eql(expected);
            });
        });
    });
});
