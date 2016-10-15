'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import extractor = require('./extractor');
import downloader = require('./downloader');
import exporter = require('./exporter');

const jobsPath = './../jobs';

function log(buffer, nl?) {
    process.stdout.write(buffer);
    if (nl) {
        process.stdout.write('\n');
    }
}

log('JBL Data Center Launcher', 1);

var tasks = process.argv.slice(2);

if (!_.first(tasks)) {
    throw new Error('Job config path not specified');
}
const jobConfigPath = jobsPath + '/' + _.first(tasks);
tasks = tasks.slice(1);

log(`Loading job config ${jobConfigPath}... `);

var job = require(jobConfigPath);

if (_.isObject(job)) {
    log('OK', 1);
} else {
    throw new Error('Job config format is malformed');
}

_.each(tasks, (task)=> {
    if (!_.has(job, task)) {
        throw new Error(`Missing ${task} on job config`);
    }
});

function executeTask(task) {
    switch (task.type) {
        case 'extract':
            return extractor.extractFromRepo(task);
        case 'download':
            return downloader.downloadHttpDocuments(task);
        case 'script':
            if (_.isFunction(task.script)) {
                return task.script();
            }
            throw new Error('Script is not a function');
        case 'export':
            return exporter.exportIntoMongo(task);
        default:
            throw new Error('Unrecognized task type');
    }
}

Promise.map(tasks, (task)=> {
    log(`\nExecuting task ${task} type ${job[task].type}... `, 1);
    if (!_.isObject(job[task])) {
        throw new Error('Task must be an object');
    }
    return executeTask(job[task]).then(()=> {
        log(`Task ${task} complete`, 1);
    });
}, { concurrency: 1 });
