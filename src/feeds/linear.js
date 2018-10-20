'use strict';

const _ = require('lodash');
const Rx = require('rxjs');
const E = require('../E');

function create(step) {
    let s, e;
    if (_.isNumber(step.body)) {
        s = 1;
        e = step.body;
    } else if (_.isArray(step.body) && step.body.length === 2) {
        [s, e] = step.body;
    } else {
        throw new E.RuntimeError(E.ERRORS.UNSUPPORTED_BODY_EXPRSSION);
    }
    return Rx.Observable.range(s, e);
}

module.exports = {
    create
};
