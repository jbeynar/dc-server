'use strict';

const _ = require('lodash');
const Rx = require('rxjs');
const E = require('../E');

function create(step) {
    if (!_.isArray(step.body)) {
        throw new E.RuntimeError(E.ERRORS.UNSUPPORTED_BODY_EXPRSSION);
    }
    return Rx.Observable.from(step.body);
}

module.exports = {
    create
};
