'use strict';

import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as _ from 'lodash';

const JOBS_PATH = './jobs';

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
