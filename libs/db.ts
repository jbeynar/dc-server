'use strict';

import * as pg from 'pg';
import * as Promise from 'bluebird';
import {config} from '../config';
import {Client} from "../node_modules/@types/pg/index";

var highlightStart = '\x1b[31m';
var highlightEnd = '\x1b[0m';
var pool = new pg.Pool(config.db.poolConfig);

let searchPathSet = false;

function setSearchPath(client: Client): Promise<Client> {
    if (searchPathSet) {
        return Promise.resolve(client);
    } else {
        // todo why it doesn't work?
        // searchPathSet = true;
        return Promise.resolve(client.query(`SET search_path TO ${config.db.schema}`).then(() => client));
    }
}

export function exceptionHandler(err) {
    console.error(highlightStart + 'SQL ' + err.toString());
    if (err.detail) {
        console.error('detail: ' + err.detail);
    }
    console.error('code: ' + err.code);
    console.error('position: ' + err.position);
    console.error('routine: ' + err.routine);
    console.log(err.stack, highlightEnd);
}

export function query(query: string, bindings?: string[]|number[]): Promise<any[]> {
    return new Promise((resolve) => {
        pool.connect().then(setSearchPath).then((client) => {
            client.query(query, bindings).then((res) => {
                client.release();
                resolve(res.rows);
            }).catch(exceptionHandler);
        }).catch(exceptionHandler);
    }).catch(exceptionHandler) as Promise<any[]>;
}

export function getPool(){
    return pool;
}
