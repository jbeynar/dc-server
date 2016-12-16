'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import chai = require('chai')
import utils = require('../utils');
import proxyquire = require('proxyquire');

const expect = chai.expect;

describe('Extractor library', () =>
{
    var extractor;
    var htmlDocument;
    var mockRepoSavedJsonDocuments : any = {};

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
            // todo this mock doesn't work since extractFromRepo has been refactor to rxjs chain
            saveJsonDocument: (type, obj) => {
                mockRepoSavedJsonDocuments[type] = mockRepoSavedJsonDocuments[type] || [];
                mockRepoSavedJsonDocuments[type].push({ body: obj });
                return Promise.resolve();
            },
            removeJsonDocuments: (type)=> {
                delete mockRepoSavedJsonDocuments[type];
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
                    return expect(err.message.toString()).to.equal(extractor.errorCodes.documentMalformedStructure);
                });
            });

            it('when called with map of non-object type', () => {
                return extractor.extract({body:htmlDocument}, 'map').catch((err)=> {
                    return expect(err.message.toString()).to.equal(extractor.errorCodes.taskMalformedStructure);
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
                return extractor.extract({body: htmlDocument}, extractionJob.extract).then((data)=> {
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
                return extractor.extract({body: htmlDocument}, mapping).then((data)=> {
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
                return extractor.extract({body: htmlDocument}, mapping).then((data)=> {
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
            return extractor.extract({body: htmlDocument}, mapping).then((data)=> {
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
            return extractor.extract({body: htmlDocument}, mapping).then((data)=> {
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
                return extractor.extract({body: htmlDocument}, mapping).then((data)=> {
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
                return extractor.extract({body: htmlDocument}, mapping).then((data)=> {
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
                return extractor.extract({body: htmlDocument}, mapping).then((data)=> {
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

            return extractor.extract({body: htmlDocument}, mapping).then((data)=>
            {
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Accept map whitelist', function ()
    {
        // todo consider droping this functionality
        it.skip('Should only extract elements passed as props param', ()=>
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

            return extractor.extract({body:htmlDocument}, mapping, ['title', 'author']).then((data)=>
            {
                return expect(data).to.eql(expected);
            });
        });
    });

    describe('Extract from database document html and save as document json', function ()
    {
        const extractionJob = {
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
            }
        };
        const expectedDevices = [
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

        afterEach(()=> {
            mockRepoSavedJsonDocuments = {};
        });

        describe('When there are documents in storage with given type name', () => {
            beforeEach(function () {
                mockRepoSavedJsonDocuments = {
                    device: [
                        {
                            body: {
                                name: 'iWatch',
                                parameters: ['CPU: 300Mhz', 'RAM: 64MB'],
                                price: '512$'
                            }
                        }
                    ]
                };
            });
            describe('And targetJsonDocuments.autoRemove is truthy', () => {
                it('Should clear documents in given type name before saving them', ()=> {
                    const extractionTask = _.cloneDeep(extractionJob.extract);
                    extractionTask.targetJsonDocuments.autoRemove = true;
                    return extractor.extractFromRepo(extractionTask).then(() => {
                        expect(_.get(mockRepoSavedJsonDocuments,'device[0].body')).to.be.eql(expectedDevices[0]);
                        expect(mockRepoSavedJsonDocuments.device[1].body).to.be.eql(expectedDevices[1]);
                        expect(mockRepoSavedJsonDocuments.device[2].body).to.be.eql(expectedDevices[2]);
                    });
                });
            });
            describe('When targetJsonDocuments.autoRemove is falsy', function () {
                it('Should clear documents in given type name before saving them', ()=> {
                    const extractionTask = _.cloneDeep(extractionJob.extract);
                    delete extractionTask.targetJsonDocuments.autoRemove;
                    const expected = [
                        {
                            name: 'iWatch',
                            parameters: ['CPU: 300Mhz', 'RAM: 64MB'],
                            price: '512$'
                        }
                    ].concat(expectedDevices);
                    return extractor.extractFromRepo(extractionTask).then(() => {
                        expect(mockRepoSavedJsonDocuments.device[0].body).to.be.eql(expected[0]);
                        expect(mockRepoSavedJsonDocuments.device[1].body).to.be.eql(expected[1]);
                        expect(mockRepoSavedJsonDocuments.device[2].body).to.be.eql(expected[2]);
                        expect(mockRepoSavedJsonDocuments.device[3].body).to.be.eql(expected[3]);
                    });
                });
            });
        });

        describe('When scope is not given', () => {
            it('Should extract flat documents and save them', () => {
                const extractionTask = {
                    sourceHttpDocuments: {
                        host: 'hakier.pl',
                        path: '/devices'
                    },
                    targetJsonDocuments: {
                        typeName: 'headers',
                        autoRemove: true
                    },
                    map: {
                        h1: {
                            singular: true,
                            selector: 'h1'
                        },
                        h2: {
                            singular: true,
                            selector: 'h2'
                        },
                        h3: {
                            singular: true,
                            selector: 'h3'
                        },
                        h4: {
                            singular: true,
                            selector: 'h4'
                        }
                    }
                };
                const expected = {
                    h1: 'Employee list',
                    h2: 'An xyz company',
                    h3: 'Leading text',
                    h4: 'Here is an employee list'
                };
                return extractor.extractFromRepo(extractionTask).then(() => {
                    expect(mockRepoSavedJsonDocuments.headers[0].body).to.be.eql(expected);
                });
            });
        });
        describe('When scope is given', () => {
            it('Should extract array of documents and save them separately', () => {
                const extractionTask = {
                    sourceHttpDocuments: {
                        host: 'hakier.pl',
                        path: '/devices'
                    },
                    targetJsonDocuments: {
                        typeName: 'employees',
                        autoRemove: true
                    },
                    scope: 'table tr',
                    map: {
                        id: {
                            singular: true,
                            selector: 'td:nth-child(1)'
                        },
                        firstName: {
                            singular: true,
                            selector: 'td:nth-child(2)'
                        },
                        lastName: {
                            singular: true,
                            selector: 'td:nth-child(3)'
                        },
                        email: {
                            singular: true,
                            selector: 'td:nth-child(4)'
                        }
                    },
                    process: (extracted) => {
                        return _.filter(extracted, 'id');
                    }
                };
                const expected = [
                    {
                        id: '1',
                        firstName: 'James',
                        lastName: 'Bond',
                        email: 'james.bond@mi6.co.uk'
                    },
                    {
                        id: '2',
                        firstName: 'Johny',
                        lastName: 'Depp',
                        email: 'johny.depp@mi6.co.uk'
                    }
                ];
                return extractor.extractFromRepo(extractionTask).then(() => {
                    expect(mockRepoSavedJsonDocuments.employees[0].body).to.be.eql(expected[0]);
                    expect(mockRepoSavedJsonDocuments.employees[1].body).to.be.eql(expected[1]);
                });
            });
        });

        it('Doesn\'t save document if extracted value is null', ()=> {
            const extractionTask = _.cloneDeep(extractionJob.extract);
            extractionTask.process = ()=> {
                return null;
            };
            return extractor.extractFromRepo(extractionTask).then(() => {
                expect(mockRepoSavedJsonDocuments).to.be.eql({});
            });
        });

        it('Doesn\'t save document if extracted value is empty array', ()=> {
            const extractionTask = _.cloneDeep(extractionJob.extract);
            extractionTask.process = ()=> {
                return [];
            };
            return extractor.extractFromRepo(extractionTask).then(() => {
                expect(mockRepoSavedJsonDocuments).to.be.eql({});
            });
        });

        it('Doesn\'t save document if extracted value is empty object', ()=> {
            const extractionTask = _.cloneDeep(extractionJob.extract);
            extractionTask.process = ()=> {
                return {};
            };
            return extractor.extractFromRepo(extractionTask).then(() => {
                expect(mockRepoSavedJsonDocuments).to.be.eql({});
            });
        });

    });
});
