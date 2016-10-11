'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const jobsPath = './../jobs';
const extractor = require('./extractor');
const downloader = require('./downloader');

function log(buffer, nl) {
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
    // todo change into switch
    if ('extract' === task.type) {
        return extractor.extractFromRepo(task);
    } else if ('download' === task.type) {
        return downloader.downloadHttpDocuments(task);
    } else {
        throw new Error('Unrecognized task type');
    }
}

Promise.map(tasks, (task)=> {
    log(`\nExecuting task ${task} type ${job[task].type}... `, 1);
    return executeTask(job[task]).then(()=> {
        log(`Task ${task} complete`, 1);
    });
}, { concurrency: 1 });
