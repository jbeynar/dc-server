'use strict';

const expect = require('chai').expect;
const rfr = require('rfr');
const utils = rfr('test/utils');
const proxyquire = require('proxyquire');
const promise = require('bluebird');
const _ = require('lodash');

describe.only('DocumentDAO', function ()
{
    var mockDocumentsSet = [
        {
            id: 1,
            type: 'valuation',
            body: {
                symbol: 'ETA',
                price: 23,
                value_1: 30,
                value_2: 30
            },
            length: 256,
            ts: new Date()
        },
        {
            id: 2,
            type: 'valuation',
            body: {
                symbol: 'ABS',
                price: 23
            },
            length: 512,
            ts: new Date()
        },
        {
            id: 3,
            type: 'valuation',
            body: {
                symbol: 'ABM',
                cz: 12,
                cwk: 23,
                value_2: 44
            },
            length: 1024,
            ts: new Date()
        }
    ];

    // todo how to check order?
    // todo needs more tests
    // combine multiple expect to return at once, DON'T USE DONE CB

    describe('getDocuments', function ()
    {
        let DocumentDAO;
        before(function ()
        {
            var dbStub = {
                query: function (query)
                {
                    return promise.resolve(_.cloneDeep(mockDocumentsSet));
                }
            };
            proxyquire('../../libs/repo/DocumentDAO', {'../db': dbStub});
            DocumentDAO = rfr('libs/repo/DocumentDAO');
        });

        it('accept whitelist', (done) =>
        {
            return DocumentDAO.getJsonDocuments(['symbol', 'cz']).then(function (data)
            {
                expect(data.results[0].body).to.eql({
                    symbol: 'ETA',
                    cz: null
                });
                expect(data.results[1].body).to.eql({
                    symbol: 'ABS',
                    cz: null
                });
                expect(data.results[2].body).to.eql({
                    symbol: 'ABM',
                    cz: 12
                });
                done();
            });
        });

        it('accept blacklist', (done) =>
        {
            return DocumentDAO.getJsonDocuments([], ['cwk']).then(function (data)
            {
                expect(data.results[0].body).to.eql({
                    cz: null,
                    symbol: 'ETA',
                    price: 23,
                    value_1: 30,
                    value_2: 30
                });
                expect(data.results[1].body).to.eql({
                    cz: null,
                    symbol: 'ABS',
                    price: 23,
                    value_2: null,
                    value_1: null
                });
                done();
            });
        });
    });


    describe('getTypes', function ()
    {
        let DocumentDAO;

        before(function ()
        {
            DocumentDAO = rfr('libs/repo/DocumentDAO');
        });

        it('works', function ()
        {
            return DocumentDAO.getJsonDocumentsTypes().then(function (data)
            {
                console.log('data:', data);
                return expect(true).to.equal(true);
            });
        });
    })

});