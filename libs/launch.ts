'use strict';

import * as Promise from 'bluebird';
import * as _ from 'lodash';
import {readdirSync, realpathSync, readdir} from "fs";
import {log} from './logger';

const JOBS_PATH = realpathSync('./jobs');

export function getJobs() {
    return new Promise((resolve) => {
        readdir(JOBS_PATH, (err, data) => {
            resolve(_.chain(data).filter(name => name.match(/.*js$/)).value());
        });
    });
}

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
}

export function run(jobName, jobTask) {
    return Promise.resolve().then(() => {
        if (!jobName) {
            const files = _.uniq(_.map(readdirSync(JOBS_PATH), file => file.replace(/\..*/, '')));
            const separator = '\n - ';
            log(`\nYou did not provide task name, available tasks: ${separator}${files.join(separator)}`);
            return;
        }
        if (_.isString(jobTask)) {
            jobTask = [jobTask];
        }
        let jobConfigPath = JOBS_PATH + '/' + jobName;

        log(`Loading job file ${jobConfigPath}... `, 1);
        const job = require(jobConfigPath);

        if (!_.isObject(job)) {
            throw new Error('Job file format is malformed');
        }

        const tasksNames = _.keys(job);

        if (_.first(jobTask) === 'listTasks') {
            log(`Job ${jobName} has ${tasksNames.length} tasks:`, 1);
            _.each(tasksNames, (taskName, index) => {
                log(`${index + 1}. ${taskName}`, 1);
            });
            return;
        }

        _.each(jobTask, (task) => {
            if (!_.has(job, task)) {
                throw new Error(`Missing task ${task} on job file`);
            }
        });

        if (_.isEmpty(jobTask)) {
            jobTask = tasksNames;
        }

        let t0, t1;
        return Promise.mapSeries(jobTask, (taskName: string) => {
            let taskClassName: () => void = job[taskName];
            if (!_.isFunction(taskClassName)) {
                throw new Error('Task must be a function');
            }
            // @ts-ignore: TS2350
            let task = new taskClassName;
            if (!task.execute) {
                throw new Error('Task must be executable');
            }
            t0 = new Date();
            log(`Executing task "${taskName}" type ${task.type}... `, 1);
            log(`Starts at ${t0.toLocaleString()}`, 1);
            return task.execute().then(() => {
                t1 = new Date();
                log(`Task "${taskName}" finished at ${t1.toLocaleString()}`, 1);
                log(`Cost ${_.round((t1 - t0) / 1000 / 60, 2)} minutes`, 1);
            });
        });
    });
}
