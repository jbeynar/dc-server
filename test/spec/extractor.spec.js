'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const expect = require('chai').expect;
const rfr = require('rfr');
const utils = rfr('test/utils');
const proxyquire = require('proxyquire');

describe('Extractor library', () =>
{
    var extractor;
    var htmlDocument;
    var mockRepoSavedDocuments = {};

    function setupMocks() {
        const mockDocumentsSet = [
            {
                id: 128,
                type: 'text/html; charset=UTF-8',
                url: 'https://hakier.pl/devices',
                host: 'hakier.pl',
                path: '/devices',
                query: null,
                code: 200,
                body: htmlDocument,
                length: htmlDocument.length,
                retry_count: 0,
                ts: '2016-10-03T20:12:10.430Z'
            }
        ];
        const dbMock = {
            query: function () {
                return Promise.resolve(_.cloneDeep(mockDocumentsSet));
            }
        };
        const repoMock = {
            saveJsonDocument: (type, obj) => {
                mockRepoSavedDocuments[type] = mockRepoSavedDocuments[type] || [];
                mockRepoSavedDocuments[type].push({ body: obj });
                return Promise.resolve();
            },
            removeJsonDocuments: (type)=> {
                mockDocumentsSet[type] = [];
                return Promise.resolve();
            }
        };
        extractor = proxyquire('../../libs/extractor', {
            './db': dbMock,
            './repo': repoMock
        });
    }

    before(function ()
    {
        return utils.getFixture('document1.html').then((fixture)=>
        {
            htmlDocument = fixture;
            setupMocks();
        });
    });

    describe('Extracts DOM element inner text based on CSS selector mapping', ()=>
    {
        describe('Rejects with appropriate error', ()=> {
            it('when called with empty document', () =>
            {
                return extractor.extract(undefined, {}).catch((err)=> {
                    return expect(err.message.toString()).to.equal(extractor.errorCodes.docEmpty);
                });
            });

            it('when called with map of non-object type', () => {
                return extractor.extract(htmlDocument, 'map').catch((err)=> {
                    return expect(err.message.toString()).to.equal(extractor.errorCodes.mapInvalid);
                });
            });
        });

        describe('Extracts', ()=> {
            it('based on simple map notation', () =>
            {
                var expected = {
                    title: 'Employee list'
                };
                var extractionJob = {
                    extract: {
                        map: {
                            title: {
                                singular: true,
                                selector: 'h1'
                            }
                        }
                    }
                };
                return extractor.extract(htmlDocument, extractionJob.extract).then((data)=> {
                    return expect(data).to.eql(expected);
                });
            });

            it('based on object map notation', () => {
                var mapping = {
                    map: {
                        title: {
                            singular: true,
                            selector: 'h1'
                        }
                    }
                };
                var expected = {
                    title: 'Employee list'
                };
                return extractor.extract(htmlDocument, mapping).then((data)=> {
                    return expect(data).to.eql(expected);
                });
            });

            it('array of values', ()=> {
                var mapping = {
                    map: {
                        heading: {
                            selector: 'th'
                        }
                    }
                };
                var expected = {
                    heading: ['ID', 'First name', 'Last name', 'Email']
                };
                return extractor.extract(htmlDocument, mapping).then((data)=> {
                    return expect(data).to.eql(expected);
                });
            });
        });
    });

    describe('Extracts DOM element attribute value', function () {
        it('Extract element attribute and apply process regexp given as string', ()=> {
            var mapping = {
                map: {
                    charset: {
                        singular: true,
                        selector: 'meta',
                        attribute: 'charset',
                        process: '\\d+'
                    }
                }
            };

            var expected = {
                charset: '8'
            };
            return extractor.extract(htmlDocument, mapping).then((data)=> {
                return expect(data).to.eql(expected);
            });
        });

        it('Extract element attribute and apply process regexp', ()=> {
            var mapping = {
                map: {
                    charset: {
                        singular: true,
                        selector: 'meta',
                        attribute: 'charset',
                        process: /\d+/
                    }
                }
            };

            var expected = {
                charset: '8'
            };
            return extractor.extract(htmlDocument, mapping).then((data)=> {
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Run process function against extracted value', function () {
        describe('Pull out element and apply process function', ()=> {
            it('as a synchronous function', () => {
                var mapping = {
                    map: {
                        title: {
                            singular: true,
                            selector: 'h1',
                            process: function (element) {
                                return element.toUpperCase();
                            }
                        }
                    }
                };
                var expected = {
                    title: 'EMPLOYEE LIST'
                };
                return extractor.extract(htmlDocument, mapping).then((data)=> {
                    return expect(data).to.eql(expected);
                });
            });

            it('as a regular expression', () => {
                var mapping = {
                    map: {
                        title: {
                            singular: true,
                            selector: 'h2',
                            process: /[a-z0-9]{3}/
                        }
                    }
                };
                var expected = {
                    title: 'xyz'
                };
                return extractor.extract(htmlDocument, mapping).then((data)=> {
                    return expect(data).to.eql(expected);
                });
            });

            it('as a regular expression given as string', () =>
            {
                var mapping = {
                    map: {
                        title: {
                            singular: true,
                            selector: 'h2',
                            process: '[a-z0-9]{3}'
                        }
                    }
                };
                var expected = {
                    title: 'xyz'
                };
                return extractor.extract(htmlDocument, mapping).then((data)=> {
                    return expect(data).to.eql(expected);
                });
            });
        });

        it('Should not crash whole extractor if one process function fail', ()=>
        {
            var mapping = {
                map: {
                    title: {
                        singular: true,
                        selector: 'h1',
                        process: function (element)
                        {
                            return element.match(/\((.*)\)/)[2];
                        }
                    },
                    subtitle: {
                        singular: true,
                        selector: 'h2'
                    }
                }
            };
            var expected = {
                title: 'Employee list',
                subtitle: 'An xyz company'
            };

            return extractor.extract(htmlDocument, mapping).then((data)=>
            {
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Accept map whitelist', function ()
    {
        it('Should only extract elements passed as props param', ()=>
        {
            var mapping = {
                map: {
                    title: {
                        singular: true,
                        selector: 'h1'
                    },
                    subtitle: {
                        singular: true,
                        selector: 'h4'
                    },
                    leading: {
                        singular: true,
                        selector: 'p'
                    },
                    author: {
                        singular: true,
                        selector: 'strong'
                    }
                }
            };

            var expected = {
                title: 'Employee list',
                author: 'Authored by jbeynar'
            };

            return extractor.extract(htmlDocument, mapping, ['title', 'author']).then((data)=>
            {
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Extract from database document html and save as document json', function ()
    {
        var extractionJob = {
            download: {
                urls: () => {
                },
                options: {
                    interval: 500,
                    headers: []
                }
            },
            extract: {
                sourceHttpDocuments: {
                    host: 'hakier.pl',
                    path: '/devices'
                },
                targetJsonDocuments: {
                    typeName: 'device',
                    autoRemove: true
                },
                scope: '#devices .device',
                map: {
                    name: {
                        singular: true,
                        selector: '.name'
                    },
                    price: {
                        singular: true,
                        selector: '.price'
                    },
                    parameters: {
                        singular: false,
                        selector: '.parameters li'
                    }
                },
                process: (extracted) => {
                    _.each(extracted, (document) => document.parameters.sort());
                    return extracted;
                }
            },
            export: {
                sourceJsonDocuments: {
                    typeName: 'device'
                },
                targetMongo: {
                    url: '',
                    collectionName: 'device',
                    autoRemove: true
                }
            }
        };
        it('Should read from storage using sourceConditions then extract, process and finally save as targetType',
            ()=> {
                var expectedExtractions = [
                    {
                        name: 'uPad',
                        parameters: ['CPU: 1GHz', 'RAM: 512MB', 'Storage: 8GB'],
                        price: '999$'
                    },
                    {
                        name: 'Nokia Lumia 735',
                        parameters: ['CPU: 1.2GHz', 'RAM: 1GB', 'Resolution: 1920x1050', 'Screen: 5"', 'Storage: 8GB'],
                        price: '128$'
                    },
                    {
                        name: 'Pendrive',
                        parameters: ['Capacity: 8GB', 'Manufacturer: Sandisk'],
                        price: '16$'
                    }
                ];
            return extractor.extractFromRepo(extractionJob.extract).then(() =>
            {
                expect(mockRepoSavedDocuments.device[0].body).to.be.eql(expectedExtractions[0]);
                expect(mockRepoSavedDocuments.device[1].body).to.be.eql(expectedExtractions[1]);
                expect(mockRepoSavedDocuments.device[2].body).to.be.eql(expectedExtractions[2]);
            });
        });
    });
});
