'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import chai = require('chai');
import proxyquire = require('proxyquire');

const expect = chai.expect;

describe('Downloader library', () => {
    var downloader;
    var mockRepoSavedHttpDocuments = [];

    before(()=> {
        const repoLibMock = {
            saveHttpDocument: (data)=> {
                mockRepoSavedHttpDocuments.push(data);
                return Promise.resolve();
            }
        };

        downloader = proxyquire('../../libs/downloader', {
            './repo': repoLibMock
        });
    });

    afterEach(()=> {
        mockRepoSavedHttpDocuments = [];
    });

    describe('downloads documents', ()=> {
        it('based on urls synchronous function', ()=> {
            const downloadJob = {
                urls: function () {
                    return _(_.range(1, 3)).map((i)=> { return `http://www.tarnowiak.pl/ogloszenie/${i}/a/`;}).value();
                }
            };
            const expectedHttpDocuments = [
                {
                    'code': 200,
                    'host': 'www.tarnowiak.pl',
                    'path': '/ogloszenie/1/a/',
                    'url': 'http://www.tarnowiak.pl/ogloszenie/1/a/'
                },
                {
                    'code': 200,
                    'host': 'www.tarnowiak.pl',
                    'path': '/ogloszenie/2/a/',
                    'url': 'http://www.tarnowiak.pl/ogloszenie/2/a/'
                }
            ];
            return downloader.downloadHttpDocuments(downloadJob).then(()=> {
                const whitelist = ['code', 'host', 'path', 'url'];
                expect(_.pick(mockRepoSavedHttpDocuments[0], whitelist)).to.eql(expectedHttpDocuments[0]);
                expect(_.pick(mockRepoSavedHttpDocuments[1], whitelist)).to.eql(expectedHttpDocuments[1]);
            });
        });
        it('based on urls asynchronous function', ()=> {
            const downloadJob = {
                urls: function () {
                    return new Promise((resolve)=> {
                        setTimeout(()=> {
                            resolve(_(_.range(1, 3)).map(
                                (i)=> { return `http://www.tarnowiak.pl/ogloszenie/${i}/a/`;}).value());
                        }, 500);
                    });
                }
            };
            const expectedHttpDocuments = [
                {
                    'code': 200,
                    'host': 'www.tarnowiak.pl',
                    'path': '/ogloszenie/1/a/',
                    'url': 'http://www.tarnowiak.pl/ogloszenie/1/a/'
                },
                {
                    'code': 200,
                    'host': 'www.tarnowiak.pl',
                    'path': '/ogloszenie/2/a/',
                    'url': 'http://www.tarnowiak.pl/ogloszenie/2/a/'
                }
            ];
            return downloader.downloadHttpDocuments(downloadJob).then(()=> {
                const whitelist = ['code', 'host', 'path', 'url'];
                expect(_.pick(mockRepoSavedHttpDocuments[0], whitelist)).to.eql(expectedHttpDocuments[0]);
                expect(_.pick(mockRepoSavedHttpDocuments[1], whitelist)).to.eql(expectedHttpDocuments[1]);
            });
        });
    });
});
