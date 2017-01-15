'use strict';

import * as pg from 'pg';
import * as Promise from 'bluebird';
import {config} from '../config';
import {Client} from "../node_modules/@types/pg/index";
import {error} from "./logger";

const pool = new pg.Pool(config.db.poolConfig);

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
    error('SQL ' + err.toString());
    if (err.detail) {
        error('detail: ' + err.detail);
    }
    error('code: ' + err.code);
    error('position: ' + err.position);
    error('routine: ' + err.routine);
    error(err.stack);
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
