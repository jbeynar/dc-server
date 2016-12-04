'use strict';

import * as proxyquire from 'proxyquire';
import {expect} from 'chai';

describe('Config', () => {
    let config;
    function reloadConfig() {
        config = proxyquire('../../config', {}).config;
    }
    describe('Given env LOGGER_SILENT is not set', () => {
        before(() => {
            process.env.LOGGER_SILENT = undefined;
            reloadConfig();
        });
        it('it should set logger.enabled to true', () => {
            expect(config.logger.enabled).to.be.eql(true);
        });
    });
    describe('Given LOGGER_SILENT env is set to 0', () => {
        before(() => {
            process.env.LOGGER_SILENT = 0;
            reloadConfig();
        });
        it('it should set logger.enabled to true', () => {
            expect(config.logger.enabled).to.be.eql(true);
        });
    });
    describe('Given LOGGER_SILENT env is set to 1', () => {
        before(() => {
            process.env.LOGGER_SILENT = 1;
            reloadConfig();
        });
        it('it should set logger.enabled to false', () => {
            expect(config.logger.enabled).to.be.eql(false);
        });
    });
});
