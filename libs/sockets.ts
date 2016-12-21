'use strict';

const io = require('socket.io-client');
import {config} from "../config";
import * as _ from 'lodash';

console.log('Sockets Mirror Setup');
const conn = io.connect(config.webapi.socketServer.url);

export function progressNotification(jobName, taskType, taskName, progress): void {
    const msg = {
        jobName: jobName,
        taskType: taskType,
        taskName: taskName,
        progress: progress
    };
    conn.emit('progressNotification', msg);
}

export function debugNotification(level, buffer): void {
    const msg = {
        level: level,
        msg: _.toString(buffer)
    };
    conn.emit('logger', msg);
}
