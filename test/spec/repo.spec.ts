'use strict';

import chai = require('chai');
import Promise = require('bluebird');
import utils = require('../utils');
import _ = require('lodash');
import {IDocumentHttp} from "../../shared/typings";
import * as repo from '../../libs/repo';

const expect = chai.expect;

describe('Repo library provide database abstraction layer', () => {

    let documents;

    before(() => {
        documents = [
            {
                type: 'valuation',
                body: JSON.stringify({
                    symbol: 'ETA',
                    price: 23,
                    value_1: 30,
                    value_2: 30
                }),
                length: 256,
                ts: (new Date()).toISOString()
            },
            {
                type: 'valuation',
                body: JSON.stringify({
                    symbol: 'ABS',
                    price: 23
                }),
                length: 512,
                ts: (new Date()).toISOString()
            },
            {
                type: 'valuation',
                body: JSON.stringify({
                    symbol: 'ABM',
                    cz: 12,
                    cwk: 23,
                    value_2: 44
                }),
                length: 1024,
                ts: (new Date()).toISOString()
            }
        ];
        return utils.truncateRepoTable('document_json').then(() => {
            return Promise.mapSeries(documents, (document) => {
                return utils.insertRepoRecord('document_json', document);
            });
        });
    });

    describe('getJsonDocuments', function ()
    {
        it('support pagination', () => {
            return repo.getJsonDocuments({type: 'valuation', from: 1, size: 2}).then((data) => {
                expect(data.results[0].body.symbol).to.eql(JSON.parse(documents[1].body).symbol);
                return expect(data.results[1].body.symbol).to.eql(JSON.parse(documents[2].body).symbol);
            });
        });
    });


    describe('getTypes', () =>
    {
        it('should return types stats', () =>
        {
            return repo.getJsonDocumentsTypes().then((data) =>
            {
                expect(data).to.be.an('array');
                expect(data[0].type).to.eql('valuation');
                expect(data[0].count).to.eql('3');
            });
        });
    });

    const documentHttp: IDocumentHttp = {
        name: 'example',
        type: 'text/html; charset=UTF-8',
        url: 'https://example.com/',
        host: 'example.com',
        path: '/',
        query: null,
        code: 200,
        headers: JSON.stringify([]),
        body: '<html><body><p>contents</p></body></html>',
        length: 100
    };

    describe('Http documents interface', () => {
        before(() => {
            return utils.truncateRepoTable('document_http');
        });

        it('should save http document and provide appropriate summary', () => {
            return repo.saveHttpDocument(documentHttp).then(() => {
                return repo.getHttpDocumentsSummary().then((data) => {
                    expect(data).to.be.an('array');
                    expect(data[0].name).to.be.equal('example');
                    expect(data[0].count).to.be.equal('1');
                    expect(data[0].avg_size).to.be.equal('100');
                });
            });
        });

        it('should remove http document and provide appropriate summary', () => {
            return repo.removeHttpDocumentsByName('example').then(() => {
                return repo.getHttpDocumentsSummary().then((data) => {
                    expect(data).to.be.an('array');
                    expect(data).to.be.empty;
                });
            });
        });

        it('rejects if documents not exists', (done) => {
            repo.removeHttpDocumentsByName('example').then(() => {
                repo.isDocumentExists('https://example.com/').catch(() => {
                    done();
                });
            });
        });

        it('resolves if documents exists', (done) => {
            repo.saveHttpDocument(documentHttp).then(() => {
                repo.isDocumentExists('https://example.com/').then(() => {
                    done();
                }).catch(() => {
                    throw new Error('shit hole');
                });
            });
        });
    });
});
