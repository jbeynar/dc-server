'use strict';

import Promise = require('bluebird');
import chai = require('chai');
import shelljs = require('shelljs');
import * as _ from 'lodash';

const expect = chai.expect;

describe('Launcher CLI', () => {
    before(() => {
        process.env.LOGGER_SILENT = 0;
    });

    it('Executs tarnowiak download task', (done) => {
        const expected = [
            'JBL Data Center Launcher 1',
            'Executing task download type TaskDownload... ',
            'Removing all http documents with name tarnowiak1/1 http://www.tarnowiak.pl/ [200]',
            'All URLs downloaded successfully',
            'Task download complete'];

        shelljs.exec('npm run dc tarnowiak download', {}, (code, stdout, stderr) => {
            const output = _.filter(stdout.split('\n'), (line) => line !== '');
            expect(output[2]).to.be.equal(expected[0]);
            expect(output[4]).to.be.equal(expected[1]);
            expect(output[5]).to.be.equal(expected[2]);
            expect(output[6]).to.be.equal(expected[3]);
            expect(output[7]).to.be.equal(expected[4]);
            done();
        });
    });

    it('Executs tarnowiak extract task', (done) => {
        const expected = [
            'JBL Data Center Launcher 1',
            'Executing task extract type TaskExtract... ',
            'Extracting 1 rows...',
            'Saved 30 JSON documents',
            'Task extract complete'];

        shelljs.exec('npm run dc tarnowiak extract', {}, (code, stdout) => {
            const output = _.filter(stdout.split('\n'), (line) => line !== '');
            expect(output[2]).to.be.equal(expected[0]);
            expect(output[4]).to.be.equal(expected[1]);
            expect(output[5]).to.be.equal(expected[2]);
            expect(output[6]).to.be.equal(expected[3]);
            expect(output[7]).to.be.equal(expected[4]);
            done();
        });
    });

});
