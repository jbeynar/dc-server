'use strict';

import * as Rx from 'rxjs';
import * as _ from 'lodash';
import Promise = require('bluebird');
import {progressNotification} from "../libs/sockets";


const source = Rx.Observable.from([
    {
        id: '8',
        size: [9, 2]
    },
    {
        id: '9',
        size: [8, 5]
    },
    {
        id: 'A',
        size: [2, 1]
    },
    {
        id: 'B',
        size: [1, 6]
    },
    {
        id: 'C',
        size: [3, 4]
    },
    {
        id: 'D',
        size: [9, 3]
    },
    {
        id: 'E',
        size: [9, 1]
    },
    {
        id: 'F',
        size: [9, 3]
    }
]);

function broadcast(task, number) {
    progressNotification('job', task.id, number)
}

source.mergeMap((x: any): Promise<any> => {
    broadcast(x, 10);
    return new Promise((resolve) => {
        setTimeout(() => {
            broadcast(x, 30);
            resolve(x);
        }, 500 * x.size[0]);
    });
}, 2).concat().mergeMap((x: any) => {
    broadcast(x, 50);
    let promise = new Promise((resolve) => {
        setTimeout(() => {
            broadcast(x, 70);
            resolve(x);
        }, 1000 * x.size[1]);
    });
    return Rx.Observable.fromPromise(promise);
}, 1).subscribe((data: any) => {
    broadcast(data, 100);
});

