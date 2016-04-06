'use strict';

const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const promise = require('bluebird');
const _ = require('lodash');

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

var mockTypesSet = [
    {
        type: 'valuation',
        count: 476,
        last_update: new Date('2016-03-29 10:59:06.564129')
    },
    {
        type: 'valuation.biznesradar',
        count: 476,
        last_update: new Date('2016-03-30 07:38:22.03407')
    },
    {
        type: 'valuation.stockwatch',
        count: 117,
        last_update: new Date('2016-04-04 22:19:52.356274')
    }
];

describe('DocumentDAO', function ()
{
    // todo check order on getDocuments

    describe('getDocuments', function ()
    {
        let DocumentDAO;

        before(function ()
        {
            var stub = {
                query: function ()
                {
                    return promise.resolve(_.cloneDeep(mockDocumentsSet));
                }
            };
            DocumentDAO = proxyquire('../../libs/repo/DocumentDAO', {'../db': stub});
        });

        it('accept whitelist', () =>
        {
            return DocumentDAO.getJsonDocuments({whitelist: ['symbol', 'cz']}).then(function (data)
            {
                expect(data.results[0].body).to.eql({
                    symbol: 'ETA',
                    cz: null
                });
                expect(data.results[1].body).to.eql({
                    symbol: 'ABS',
                    cz: null
                });
                return expect(data.results[2].body).to.eql({
                    symbol: 'ABM',
                    cz: 12
                });
            });
        });

        it('accept blacklist', () =>
        {
            return DocumentDAO.getJsonDocuments({blacklist: ['cwk']}).then(function (data)
            {
                expect(data.results[0].body).to.eql({
                    cz: null,
                    symbol: 'ETA',
                    price: 23,
                    value_1: 30,
                    value_2: 30
                });
                return expect(data.results[1].body).to.eql({
                    cz: null,
                    symbol: 'ABS',
                    price: 23,
                    value_2: null,
                    value_1: null
                });
            });
        });
    });


    describe('getTypes', function ()
    {
        let DocumentDAO;

        before(function ()
        {
            var stub = {
                query: function ()
                {
                    return promise.resolve(_.cloneDeep(mockTypesSet));
                }
            };
            DocumentDAO = proxyquire('../../libs/repo/DocumentDAO', {'../db': stub});
        });

        it('should return types stats', function ()
        {
            return DocumentDAO.getJsonDocumentsTypes().then(function (data)
            {
                expect(data).to.be.an('array');
                return expect(data).to.eql(mockTypesSet);
            });
        });
    });
});
