'use strict';

const E = require('../E');
const _ = require('lodash');

function decorateWithOperator(step, observable) {
    if (!_.isFunction(step.body)) {
        throw new Error(E.ERRORS.UNSUPPORTED_BODY_EXPRSSION);
    }
    return observable.map(step.body);
}

module.exports = {
    decorateWithOperator
};
