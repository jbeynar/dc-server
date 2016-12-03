'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import chai = require('chai')
import shelljs = require('shelljs')

const expect = chai.expect;

describe.skip('Launcher CLI', () => {

    it('Executs command and exit from process', (done) => {
        shelljs.exec('npm run dc tarnowiak', {}, (code, err, out) => {
            console.log(out);
            done();
        });
    });

});
