'use strict';

import * as _ from 'lodash';
import * as Promise from 'bluebird';
import {log} from "./logger";
import {extractFromRepo} from "./extractor";
import {downloadHttpDocuments} from "./downloader";
import {exportIntoMongo} from "./exporter";
import {readdirSync} from "fs";

const jobsPath = './../jobs';

log('JBL Data Center Launcher', 1);

let tasks = process.argv.slice(2);
const jobName = _.first(tasks);

if (!jobName) {
    const files = _.uniq(_.map(readdirSync(jobsPath), file => file.replace(/\..*/, '')));
    const separator = '\n - ';
    console.log(`\nYou did not provide task name, available tasks: ${separator}${files.join(separator)}`);
    process.exit();
}

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
            return extractFromRepo(task);
        case 'download':
            return downloadHttpDocuments(task);
        case 'script':
            if (_.isFunction(task.script)) {
                return task.script();
            }
            throw new Error('Script is not a function');
        case 'export':
            return exportIntoMongo(task);
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
