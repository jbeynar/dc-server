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
        it('based on urls array', function () {
            const downloadJob = {
                urls: ['https://code.jquery.com/jquery-3.1.1.js',
                    'https://code.jquery.com/jquery-2.2.4.js']
            };
            const expectedHttpDocuments = [
                {
                    type: 'application/javascript; charset=utf-8',
                    url: 'https://code.jquery.com/jquery-3.1.1.js',
                    host: 'code.jquery.com',
                    path: '/jquery-3.1.1.js',
                    query: null,
                    code: 200,
                    length: 267194
                },
                {
                    type: 'application/javascript; charset=utf-8',
                    url: 'https://code.jquery.com/jquery-2.2.4.js',
                    host: 'code.jquery.com',
                    path: '/jquery-2.2.4.js',
                    query: null,
                    code: 200,
                    length: 257551
                }
            ];
            return downloader.downloadHttpDocuments(downloadJob).then(()=> {
                expect(_.omit(mockRepoSavedHttpDocuments[0], 'body', 'headers')).to.eql(expectedHttpDocuments[0]);
                expect(_.omit(mockRepoSavedHttpDocuments[1], 'body', 'headers')).to.eql(expectedHttpDocuments[1]);
            });
        });
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
