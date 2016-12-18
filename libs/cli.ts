'use strict';

import * as _ from 'lodash';
import {run} from "./launch";

console.log('JBL Data Center Launcher', 1);

const tasks = process.argv.slice(2);
const jobName = _.first(tasks);

run(jobName, tasks.slice(1)).finally(() => {
    // setTimeout cause socket-client makes process hanging.
    // todo socket client disconnect in elegant way
    setTimeout(process.exit, 10);
});
