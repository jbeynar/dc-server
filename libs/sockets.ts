'use strict';

const io = require('socket.io-client');
import {config} from "../config";

const conn = io.connect(config.webapi.socketServer.url);

export function progressNotification(jobName, taskName, progressPercent) {
    const msg = {
        jobName: jobName,
        taskName: taskName,
        progressPercent: progressPercent
    };
    conn.emit('progressNotification', msg)
}
