'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import chai = require('chai')
import utils = require('../utils');
import proxyquire = require('proxyquire');
import * as repo from './../../libs/repo';
import {IDocumentHttp} from "../../shared/typings";

const expect = chai.expect;

describe('Fetch from repo database document_json table, extract and save in document_json table', () => {

    const extractor = require('./../../libs/extractor');

    before(function () {
        return utils.getFixture('document1.html').then((fixtureHtmlDocument) => {
            const mockDocument: IDocumentHttp = {
                id: 128,
                name: 'exampleDevices',
                type: 'text/html; charset=UTF-8',
                url: 'https://example.com/devices',
                host: 'example.com',
                path: '/devices',
                query: null,
                code: 200,
                headers: JSON.stringify([]),
                body: fixtureHtmlDocument,
                length: fixtureHtmlDocument.length,
                retry_count: 0,
                ts: (new Date('2016-10-03T20:12:10.430Z')).toISOString()
            };

            return utils.truncateRepoTable('document_http').then(() => {
                return utils.insertRepoRecord('document_http', mockDocument);
            });
        });
    });

    const extractionJob = {
        extract: {
            sourceHttpDocuments: {
                name: 'exampleDevices'
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
    const devices = [
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
        },
        {
            name: 'iWatch',
            parameters: ['CPU: 300Mhz', 'RAM: 64MB'],
            price: '512$'
        }
    ];

    describe('When there are documents in storage with given type name', () => {

        beforeEach(function () {
            return utils.truncateRepoTable('document_json').then(() => {
                const device = {type: 'device', body: JSON.stringify(devices[0])};
                return utils.insertRepoRecord('document_json', device);
            });
        });

        describe('And targetJsonDocuments.autoRemove is truthy', () => {
            it('Should clear documents in given type name before saving them', () => {
                const extractionTask = _.cloneDeep(extractionJob.extract);
                extractionTask.targetJsonDocuments.autoRemove = true;
                return extractor.extractFromRepo(extractionTask).then(() => {
                    return repo.getJsonDocuments({sort: {name: 'ASC'}}).then((data) => {
                        expect(data.results.length).to.be.eql(3);
                        expect(data.results[0].body).to.be.eql(devices[1]);
                        expect(data.results[1].body).to.be.eql(devices[2]);
                        expect(data.results[2].body).to.be.eql(devices[0]);
                    });
                });
            });
        });

        describe('When targetJsonDocuments.autoRemove is not set', function () {
            it('Should NOT clear documents in given type name before saving them', () => {
                const extractionTask = _.cloneDeep(extractionJob.extract);
                delete extractionTask.targetJsonDocuments.autoRemove;
                return extractor.extractFromRepo(extractionTask).then(() => {
                    return repo.getJsonDocuments({sort: {name: 'ASC'}}).then((data) => {
                        expect(data.results.length).to.be.eql(4);
                        expect(data.results[0].body).to.be.eql(devices[1]);
                        expect(data.results[1].body).to.be.eql(devices[2]);
                        expect(data.results[2].body).to.be.eql(devices[0]);
                        expect(data.results[3].body).to.be.eql(devices[0]);
                    });
                });
            });
        });
    });

    describe('When scope is not given', () => {
        it('Should extract flat documents and save them', () => {
            const extractionTask = {
                sourceHttpDocuments: {
                    name: 'exampleDevices'
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
                return repo.getJsonDocuments({type: 'headers', sort: {name: 'ASC'}}).then((data) => {
                    expect(data.results[0].body).to.be.eql(expected);
                });
            });
        });
    });
    describe('When scope is given', () => {
        it('Should extract array of documents and save each scoped item as new document', () => {
            const extractionTask = {
                sourceHttpDocuments: {
                    name: 'exampleDevices'
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
                return repo.getJsonDocuments({type: 'employees', sort: {id: 'ASC'}}).then((data) => {
                    expect(data.results[0].body).to.be.eql(expected[0]);
                    expect(data.results[1].body).to.be.eql(expected[1]);
                });
            });
        });
    });

    it('Doesn\'t save document if extracted value is null', () => {
        const extractionTask = _.cloneDeep(extractionJob.extract);
        extractionTask.process = () => {
            return null;
        };
        return extractor.extractFromRepo(extractionTask).then(() => {
            return repo.getJsonDocuments({type: 'device', sort: {name: 'ASC'}}).then((data) => {
                expect(data.results.length).to.be.eql(0);
            });
        });
    });

    it('Doesn\'t save document if extracted value is empty array', () => {
        const extractionTask = _.cloneDeep(extractionJob.extract);
        extractionTask.process = () => {
            return [];
        };
        return extractor.extractFromRepo(extractionTask).then(() => {
            return repo.getJsonDocuments({type: 'device', sort: {name: 'ASC'}}).then((data) => {
                expect(data.results.length).to.be.eql(0);
            });
        });
    });

    it('Doesn\'t save document if extracted value is empty object', () => {
        const extractionTask = _.cloneDeep(extractionJob.extract);
        extractionTask.process = () => {
            return {};
        };
        return extractor.extractFromRepo(extractionTask).then(() => {
            return repo.getJsonDocuments({type: 'device', sort: {name: 'ASC'}}).then((data) => {
                expect(data.results.length).to.be.eql(0);
            });
        });
    });

});
