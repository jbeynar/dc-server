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
const jobName = _.first(tasks);
const jobConfigPath = jobsPath + '/' + jobName;
tasks = tasks.slice(1);

log(`Loading job config ${jobConfigPath}... `);

const job = require(jobConfigPath);

if (!_.isObject(job)) {
    throw new Error('Job config format is malformed');
}

const tasksNames = _.keys(job);

if (_.first(tasks) === 'listTasks') {
    log(`Job ${jobName} has ${tasksNames.length} tasks:`, 1);
    _.each(tasksNames, (taskName, index)=> {
        log(`${index + 1}. ${taskName}`, 1);
    });
    process.exit();
}

_.each(tasks, (task)=> {
    if (!_.has(job, task)) {
        throw new Error(`Missing ${task} on job config`);
    }
});

if (_.isEmpty(tasks)) {
    tasks = tasksNames;
}

export interface ITaskScript {
    type: 'script';
    script: any;
}

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

Promise.mapSeries(tasks, (task)=> {
    if (!_.isObject(job[task])) {
        throw new Error('Task must be an object');
    }
    log(`\nExecuting task ${task} type ${job[task].type}... `, 1);
    return executeTask(job[task]).then(()=> {
        log(`Task ${task} complete`, 1);
    });
});
