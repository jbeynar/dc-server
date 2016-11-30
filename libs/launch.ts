'use strict';

import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import {readdirSync} from "fs";
import {log} from './logger';
import {Task} from "../shared/typings";

const JOBS_PATH = './../jobs';

export function getJobs() {
    return new Promise((resolve) => {
        fs.readdir(JOBS_PATH, (err, data) => {
            resolve(_.chain(data).filter(name => name.match(/.*js$/)).value());
        });
    });
};

export function getTasks() {
    return this.getJobs().then((jobs) => {
        return _.reduce(jobs, (acc, job: string) => {
            let jobsModule = require(`${JOBS_PATH}/${job}`);
            acc[job] = {
                tasks: _.keys(jobsModule),
                source: jobsModule
            };
            return acc;
        }, {});
    });
};

export function run(jobName, jobTask){
    if (!jobName) {
        const files = _.uniq(_.map(readdirSync(JOBS_PATH), file => file.replace(/\..*/, '')));
        const separator = '\n - ';
        console.log(`\nYou did not provide task name, available tasks: ${separator}${files.join(separator)}`);
        process.exit();
    }

    let jobConfigPath = JOBS_PATH + '/' + jobName;

    log(`Loading job config ${jobConfigPath}... `, 1);

    const job = require(jobConfigPath);

    if (!_.isObject(job)) {
        throw new Error('Job config format is malformed');
    }

    const tasksNames = _.keys(job);

    if (_.first(jobTask) === 'listTasks') {
        log(`Job ${jobName} has ${tasksNames.length} tasks:`, 1);
        _.each(tasksNames, (taskName, index) => {
            log(`${index + 1}. ${taskName}`, 1);
        });
        process.exit();
    }

    _.each(jobTask, (task) => {
        if (!_.has(job, task)) {
            throw new Error(`Missing ${task} on job config`);
        }
    });

    if (_.isEmpty(jobTask)) {
        jobTask = tasksNames;
    }

    return Promise.mapSeries(jobTask, (taskName: string) => {
        if (!_.isObject(job[taskName])) {
            throw new Error('Task must be an object');
        }
        let task: Task = new job[taskName];
        log(`\nExecuting task ${taskName} type ${task.type}... `, 1);
        return task.execute().then(() => {
            log(`Task ${taskName} complete`, 1);
        });
    });

}
