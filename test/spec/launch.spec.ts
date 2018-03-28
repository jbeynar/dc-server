'use strict';

import * as chai from 'chai';
import * as fs from 'fs';
import * as proxyquire from 'proxyquire';
import * as promise from 'bluebird';
import * as _ from 'lodash';

const JOBS_PATH = fs.realpathSync('./test/jobs');

import * as sinon from 'sinon';
const expect = chai.expect;

const logSpy = sinon.spy();
const mockedDependencies = {
    fs: {
        realpathSync: () => {
            return JOBS_PATH;
        },
        readdir: (path, callback) => {
            callback(null, [
                'tarnowiak.ts',
                'tarnowiak.js',
                'bmw.ts',
            ]);
        }
    },
    './logger': {
        log: logSpy
    }
};
let launch;

function proxyquireLaunch(dependencies : {[key:string]:any}) {
    launch = proxyquire('../../libs/launch', _.assign({}, mockedDependencies, dependencies));
}

describe('Launch library', () => {
    beforeEach(() => {
        proxyquireLaunch({});
    });
    describe('getJobs', () => {
        it('should return only js files', done => {
            launch.getJobs().then(files => {
                expect(['tarnowiak.js']).to.be.eql(files);
                done();
            });
        });
    });
    describe('getTasks', () => {
        it('should return all jobs from jobs folder as map with tasks and source keys', done => {
            launch.getTasks().then(tasks => {
                expect(_.get(tasks, ['tarnowiak.js', 'tasks'])).to.be.eql(['download', 'extract']);
                expect(_.keys(_.get(tasks, ['tarnowiak.js', 'source']))).to.be.eql(['download', 'extract']);
                done();
            });
        });
    });
    describe('run', () => {
        describe('Given empty jobName or none', () => {
            after(() => {
                logSpy.reset();
            });
            it('should log "You did not provide task name, available tasks:" with list of tasks and return', () => {
                launch.run().then(() => {
                    const separator = '\n - ';
                    const files = ['bmw', 'tarnowiak'];
                    sinon.assert.calledOnce(logSpy);
                    sinon.assert.calledWith(logSpy, `\nYou did not provide task name, available tasks: ${separator}${files.join(separator)}`);
                });
            });
        });
        describe('Given job name', () => {
            afterEach(() => {
                logSpy.reset();
            });
            describe('And job is not an object', () => {
                let notExpectedError;
                beforeEach(() => {
                    notExpectedError = new Error('some error message');
                    let dependencies = {};

                    dependencies[`${JOBS_PATH}/bmw`] = 666;
                    proxyquireLaunch(dependencies);
                });
                it('should inform that "job file format is malformed"', () => {
                    launch.run('bmw').then(() => {
                        throw notExpectedError;
                    }).catch(err => {
                        expect(err.message).to.be.eql('Job file format is malformed');
                    });
                });
            });
            describe('And jobTask is equal "listTasks"', () => {
                it('should inform how many tasks has given job and list them', () => {
                    let jobName = 'tarnowiak';
                    launch.run(jobName, 'listTasks').then(() => {
                        sinon.assert.calledWith(logSpy, `Job ${jobName} has 2 tasks:`);
                        sinon.assert.calledWith(logSpy, `1. download`);
                        sinon.assert.calledWith(logSpy, `2. extract`);
                    });
                });
            });
            describe('Given not existing jobTask', () => {
                let notExpectedError;
                before(() => {
                    notExpectedError = new Error('some error message');
                });
                it('should throw error with message that task is missing on job file', () => {
                    launch.run('tarnowiak', 'none').then(() => {
                        throw notExpectedError;
                    }).catch(err => {
                        expect(err.message).to.be.eql(`Missing task none on job file`);
                    });
                });
            });
            describe('Given existing jobTask', () => {
                describe('And it is not a function', () => {
                    let notExpectedError;
                    beforeEach(() => {
                        notExpectedError = new Error('some error message');
                        let dependencies = {};

                        dependencies[`${JOBS_PATH}/tarnowiak`] = {
                            notAFunction: {}
                        };
                        proxyquireLaunch(dependencies);
                    });
                    it('Should reject with error "Task must a function"', () => {
                        launch.run('tarnowiak', 'notAFunction').then(() => {
                            throw notExpectedError;
                        }).catch(err => {
                            expect(err.message).to.be.eql('Task must be a function');
                        });
                    });
                });
                describe('And it is a function but has no method execute', () => {
                    let notExpectedError;
                    beforeEach(() => {
                        notExpectedError = new Error('some error message');
                        let dependencies = {};

                        dependencies[`${JOBS_PATH}/tarnowiak`] = {
                            functionWithoutMethodExecute: function() {}
                        };
                        proxyquireLaunch(dependencies);
                    });
                    it('Should reject with error "Task must executable"', () => {
                        launch.run('tarnowiak', 'functionWithoutMethodExecute').then(() => {
                            throw notExpectedError;
                        }).catch(err => {
                            expect(err.message).to.be.eql('Task must be executable');
                        });
                    });
                });
                describe('Ant it is a function with execute method', () => {
                    let executeSpy;
                    beforeEach(() => {
                        let dependencies = {};
                        let functionWithMethodExecute = function() {};

                        executeSpy = sinon.spy(() => Promise.resolve());
                        functionWithMethodExecute.prototype.execute = executeSpy;
                        functionWithMethodExecute.prototype.type = 'TaskExtract';

                        dependencies[`${JOBS_PATH}/tarnowiak`] = {
                            functionWithMethodExecute
                        };
                        proxyquireLaunch(dependencies);
                    });
                    it('should inform about executing it and what type it is', () => {
                        launch.run('tarnowiak', 'functionWithMethodExecute').then(() => {
                            expect('Executing task "functionWithMethodExecute" type TaskExtract... ').to.be.eql(logSpy.secondCall.args[0]);
                        });
                    });
                    it('should call execute method', () => {
                        launch.run('tarnowiak', 'functionWithMethodExecute').then(() => {
                            sinon.assert.calledOnce(executeSpy);
                        });
                    });
                    it('should inform when executing task is complete', () => {
                        launch.run('tarnowiak', 'functionWithMethodExecute').then(() => {
                            expect('Task "functionWithMethodExecute" finished at').to.be.eql(String(logSpy.getCall(3).args[0]).substr(0, 44));
                        });
                    });
                });
            });
            describe('Given nullable or none jobTask', () => {
                let downloadExecuteSpy;
                let extractExecuteSpy;
                beforeEach(() => {
                    let dependencies = {};
                    let downloadMock = function() {};
                    let extractMock = function() {};

                    downloadExecuteSpy = sinon.spy(() => Promise.resolve());
                    extractExecuteSpy = sinon.spy(() => Promise.resolve());
                    downloadMock.prototype.execute = downloadExecuteSpy;
                    extractMock.prototype.execute = extractExecuteSpy;

                    dependencies[`${JOBS_PATH}/tarnowiak`] = {
                        download: downloadMock,
                        extract: extractMock
                    };
                    proxyquireLaunch(dependencies);
                });
                it('should execute all tasks', () => {
                    let jobName = 'tarnowiak';
                    launch.run(jobName).then(() => {
                        sinon.assert.calledOnce(downloadExecuteSpy);
                        sinon.assert.calledOnce(extractExecuteSpy);
                    });
                });
            });
        });
    });
});
