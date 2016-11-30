'use strict';

import * as _ from 'lodash';
import * as Promise from 'bluebird';
import {log} from "./logger";
import {extractFromRepo} from "./extractor";
import {downloadHttpDocuments} from "./downloader";
import {exportIntoMongo} from "./exporter";
import {readdirSync} from "fs";
import {Task} from "../shared/typings";

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

Promise.mapSeries(tasks, (taskName: string) => {
    if (!_.isObject(job[taskName])) {
        throw new Error('Task must be an object');
    }
    let task: Task = new job[taskName];
    log(`\nExecuting task ${taskName} type ${task.type}... `, 1);
    return task.execute().then(() => {
        log(`Task ${taskName} complete`, 1);
    });
});
