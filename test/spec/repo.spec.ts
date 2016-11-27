'use strict';

import chai = require('chai');
import proxyquire = require('proxyquire');
import promise = require('bluebird');
import _ = require('lodash');
import rfr = require('rfr');

const expect = chai.expect;

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
        type: 'valuation',
        count: 476,
        last_update: new Date('2016-03-30 07:38:22.03407')
    },
    {
        type: 'valuation',
        count: 117,
        last_update: new Date('2016-04-04 22:19:52.356274')
    }
];

describe('Repo library', function ()
{
    describe('getJsonDocuments', function ()
    {
        let repo;

        before(function ()
        {
            var stub = {
                query: function ()
                {
                    return promise.resolve(_.cloneDeep(mockDocumentsSet));
                }
            };
            repo = proxyquire('../../libs/repo', {'./db': stub});
        });

        it('accept whitelist', () =>
        {
            return repo.getJsonDocuments({whitelist: ['symbol', 'cz']}).then(function (data)
            {
                expect(data.results[0].body).to.eql({
                    symbol: 'ETA',
                    cz: undefined
                });
                expect(data.results[1].body).to.eql({
                    symbol: 'ABS',
                    cz: undefined
                });
                return expect(data.results[2].body).to.eql({
                    symbol: 'ABM',
                    cz: 12
                });
            });
        });

        it('accept blacklist', () =>
        {
            return repo.getJsonDocuments({blacklist: ['cwk']}).then(function (data)
            {
                expect(data.results[0].body).to.eql({
                    cz: undefined,
                    symbol: 'ETA',
                    price: 23,
                    value_1: 30,
                    value_2: 30
                });
                return expect(data.results[1].body).to.eql({
                    cz: undefined,
                    symbol: 'ABS',
                    price: 23,
                    value_2: undefined,
                    value_1: undefined
                });
            });
        });
    });


    describe('getTypes', function ()
    {
        let repo;

        before(function ()
        {
            var stub = {
                query: function ()
                {
                    return promise.resolve(_.cloneDeep(mockTypesSet));
                }
            };
            repo = proxyquire('../../libs/repo', {'./db': stub});
        });

        it('should return types stats', function ()
        {
            return repo.getJsonDocumentsTypes().then(function (data)
            {
                expect(data).to.be.an('array');
                return expect(data).to.eql(mockTypesSet);
            });
        });
    });

    describe('mergeDocuments', ()=>
    {

        // proxyquire db.query for many times response with diffrent data - how?
        let repo = rfr('libs/repo');

        //TODO: fix it to work without running DB
        it('should merge two document types', ()=>
        {
            var type1Cfg = {
                type: 'valuation.biznesradar',
                id: 'symbol'
            };
            var type2Cfg = {
                type: 'valuation.stockwatch',
                id: 'symbol'
            };
            return repo.mergeDocuments(type1Cfg, type2Cfg, 'merged');
        });
    });
});
