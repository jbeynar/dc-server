'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import chai = require('chai')
import utils = require('../utils');
import proxyquire = require('proxyquire');
import * as Squel from 'squel';
import * as repo from './../../libs/repo';

const squel = Squel.useFlavour('postgres');

const expect = chai.expect;

describe('Extractor library', () =>
{
    const extractor = require('./../../libs/extractor');
    var htmlDocument;
    var mockRepoSavedJsonDocuments : any = {};

    before(function ()
    {
        return utils.getFixture('document1.html').then((fixture)=>
        {
            htmlDocument = fixture;
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
});
