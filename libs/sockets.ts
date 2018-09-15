'use strict';

const io = require('socket.io-client');
import {config} from "../config";
import * as _ from 'lodash';

let conn;

export function initializeConnection() {
    conn = io.connect(config.webapi.socketServer.url);
}

export function sendTaskStatus(jobName, taskType, taskName, progress): void {
    conn.emit('progressNotification', {
        jobName: jobName,
        taskType: taskType,
        taskName: taskName,
        progress: progress
    });
}

export function debugNotification(level, buffer): void {
    conn.emit('logger', {
        level: level,
        msg: _.toString(buffer)
    });
}
