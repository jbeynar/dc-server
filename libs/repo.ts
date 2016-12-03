'use strict';

import * as _ from 'lodash';
import * as Squel from 'squel';
import * as db from './db';
import * as Promise from 'bluebird';
import {IJsonSearchConfig, IDocumentHttp} from "../shared/typings";

const squel = Squel.useFlavour('postgres');

// todo(hakier) check this with frontend
export function removeJsonDocuments(type) {
    const query = squel.delete().from('repo.document_json').where('type=?', type).toParam();
    return db.query(query.text, query.values);
}

export function saveJsonDocument(type, obj) {
    const json = JSON.stringify(obj);
    const data = {
        type: type,
        body: json,
        length: json.length || 0
    };
    const query = squel.insert().into('repo.document_json').setFields(data).toParam();
    //todo check wheteher it works without bluebird Promise wrapping
    return db.query(query.text, query.values);
}

export function getJsonDocuments(config: IJsonSearchConfig) {
    const query = _.cloneDeep(config);
    const stmt = squel.select().from('repo.document_json').order('id');
    if (query.type) {
        stmt.where('type=?', query.type);
    }
    // todo(hakier) check frontend with this
    return db.query(stmt.toString()).then(function (rows) {
        let keys;
        let allProps = {};
        _.forEach(rows, function (record) {
            _.assign(allProps, record.body);
        });
        allProps = _.keys(allProps);
        if (_.isEmpty(query.whitelist)) {
            keys = allProps;
            if (!_.isEmpty(query.blacklist)) {
                keys = _.filter(keys, function (key) {
                    return query.blacklist.indexOf(key) === -1;
                });
            }
            keys = _.sortBy(keys);
        } else {
            keys = query.whitelist;
        }
        _.forEach(rows, function (record)
        {
            const sortedBody = {};
            _.forEach(keys, function (key)
            {
                sortedBody[key] = record.body[key];
            });
            record.body = sortedBody;
        });
        return {
            properties: allProps,
            results: rows
        };
    });
}

// todo(hakier) check with frontend
export function getJsonDocumentsTypes() {
    return db.query('SELECT type, COUNT(*) as count, MAX(ts) as last_change FROM repo.document_json GROUP BY type');
}

/**
 * Type config:
 * {
 *      type: 'string'
 *      id:   'string'
 * }
 */
// todo replace with lodash operators lib
export function mergeDocuments(type1Config, type2Config, destinationType) {
    if (!_.isObject(type1Config) || !_.isObject(type2Config)) {
        throw new Error('Types configs must by of Objects type');
    }
    if (!(_.isString(destinationType) && !_.isEmpty(destinationType))) {
        throw new Error('Destination type must be not empty string');
    }
    const stmt1 = squel.select().from('repo.document_json').where('type=?', type1Config.type).toString();
    return db.query(stmt1).then((results1)=>
    {
        return Promise.map(results1, (doc1 : any) =>
        {
            const mergeId = _.get(doc1.body, type1Config.id);
            const stmt2 = squel.select()
                .from('repo.document_json')
                .where('type=?', type2Config.type)
                .where('body->>\'' + type2Config.id + '\'=?', mergeId)
                .toString();
            return db.query(stmt2).then(function (results2)
            {
                // todo avoid collision of having properties with sames key name
                return saveJsonDocument(destinationType, _.assign({}, doc1.body, _.get(results2, '[0].body')));
            });
        });
    });
}

export function saveHttpDocument(data: IDocumentHttp) {
    const query = squel.insert().into('repo.document_http').setFields(data).toParam();
    return db.query(query.text, query.values);
}

export function getHttpDocumentsSummary() {
    const query = 'SELECT name, COUNT(*) as count, AVG(length)::bigint as avg_size, MAX(ts) as latest ' +
        'FROM repo.document_http GROUP BY name';
    return db.query(query);
}

// todo(hakier) check with frontend
export function removeHttpDocumentsByHost(host) {
    throw new Error('This method is deprecated, use removeHttpDocumentsByName instead');
    // const query = 'DELETE FROM repo.document_http WHERE host LIKE $1';
    // return db.query(query, [host]);
}

export function removeHttpDocumentsByName(name) {
    const query = 'DELETE FROM repo.document_http WHERE name LIKE $1';
    return db.query(query, [name]);
}
