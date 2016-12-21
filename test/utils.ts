'use strict';

import rfr = require('rfr');
import promise = require('bluebird');
import {query} from "../libs/db";
import * as Squel from 'squel';
const fs : any = promise.promisifyAll(require('fs'));

const squel = Squel.useFlavour('postgres');

const fixturesPath = 'test/fixtures';

export function getFixture(name)
{
    return fs.readFileAsync([fixturesPath, name].join('/')).then((file)=>
    {
        return file.toString();
    });
}

export function truncateRepoTable(tablename) {
    const q = squel.delete().from(tablename).toString();
    return query(q);
}

export function insertRepoRecord(tablename, record) {
    const q = squel.insert().into(tablename).setFields(record).toParam();
    return query(q.text, q.values);
}
