'use strict';

import * as _ from 'lodash';
import {config} from '../../config';
import chai = require('chai');
const $http = require('http-as-promised');

const expect = chai.expect;

function url(path) {
    return `http://${config.webapi.httpServer.host}:${config.webapi.httpServer.port}${path}`;
}

describe('Provide webapi as a http server', () => {
    let app;

    before(() => {
        // todo don't we need to capture app unregister callback, and destroy at the end?
        // todo use test config to not conflict with running app
        app = require('../../webapi');
    });

    describe('Repo API', () => {

        it('/repo/json/types', () => {
            return $http.get(url('/repo/json/types')).spread((result, rawBody) => {
                const body = JSON.parse(rawBody);
                expect(result.statusCode).to.be.eql(200);
                expect(body).to.be.an('object');
                expect(body).to.has.property('data');
                expect(body.data).to.be.an('array');
                if (!_.isEmpty(body.data)) {
                    _.forEach(body.data, (type) => {
                        expect(type).to.has.property('type');
                        expect(type).to.has.property('count');
                        expect(type).to.has.property('last_change');
                    });
                }
            });
        });

        it('/repo/http/summary', () => {
            return $http.get(url('/repo/http/summary')).spread((result, rawBody) => {
                const body = JSON.parse(rawBody);
                expect(result.statusCode).to.be.eql(200);
                expect(body).to.be.an('object');
                expect(body).to.has.property('data');
                expect(body.data).to.be.an('array');
                if (!_.isEmpty(body.data)) {
                    _.forEach(body.data, (summary) => {
                        expect(summary).to.has.property('name');
                        expect(summary).to.has.property('count');
                        expect(summary).to.has.property('avg_size');
                        expect(summary).to.has.property('latest');
                    });
                }
            });
        });

    });

});
