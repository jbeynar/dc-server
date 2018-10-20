'use strict';

const _ = require('lodash');
const E = require('./E');

const linearFeed = require('./feeds/linear');
const staticFeed = require('./feeds/static');
const mapOperator = require('./operators/map');
const downloadOperator = require('./operators/download');
const extractOperator = require('./operators/extract');

const operatorsMap = {
    'linear-feed': linearFeed.create,
    'static-feed': staticFeed.create,
    'map': mapOperator.decorateWithOperator,
    'download': downloadOperator.decorateWithOperator,
    'extract': extractOperator.decorateWithOperator
};

function executeStep(step, observable) {
    if (!_.has(operatorsMap, step.operator) || !_.isFunction(operatorsMap[step.operator])) {
        throw new E.RuntimeError(E.ERRORS.UNSUPPORTED_OPERATOR, step);
    }
    return (operatorsMap[step.operator])(step, observable);
}

function executeJob(job) {
    const feed = executeStep(_.first(job.steps));
    return _.reduce(_.drop(job.steps, 1), (feed, step) => {
        return executeStep(step, feed);
    }, feed);
}

module.exports = {
    executeJob
};
