'use strict';

import * as chai from 'chai';
import * as fs from 'fs';
import * as proxyquire from 'proxyquire';
import * as promise from 'bluebird';
import * as _ from 'lodash';

const JOBS_PATH = fs.realpathSync('./test/jobs');

const expect = chai.expect;
const launch = proxyquire('../../libs/launch', {
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
    '../jobs/bmw.js':  {},
});

describe.only('Launch library', () => {
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
        launch.run('tarnowiak.js', 'download').then(() => {

        });
    });
});
