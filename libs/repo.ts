'use strict';

import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as Squel from 'squel';
import * as db from './db';
import {IJsonSearchConfig, IDocumentHttp, IJsonSearchResults} from "../shared/typings";

const squel = Squel.useFlavour('postgres');

export function removeJsonDocuments(type) {
    const query = squel.delete().from('document_json').where('type=?', type).toParam();
    return db.query(query.text, query.values);
}

export function saveJsonDocument(type, obj) {
    const json = JSON.stringify(obj);
    const data = {
        type: type,
        body: json,
        length: json.length || 0
    };
    const query = squel.insert().into('document_json').setFields(data).toParam();
    //todo check wheteher it works without bluebird Promise wrapping
    return db.query(query.text, query.values);
}

export function getJsonDocuments(config?: IJsonSearchConfig) {
    const query = _.cloneDeep(config) || {};
    const stmt = squel.select().from('document_json');

    if (query.type) {
        stmt.where('type=?', query.type);
    }

    if (!_.isEmpty(query.sort)) {
        _.forEach(query.sort, (direction, value) => {
            stmt.order(`body->'${value}'`, direction === 'DESC' ? false : true);
        });
    } else {
        stmt.order('id');
    }

    if (_.isNumber(query.from)) {
        stmt.offset(query.from);
    }

    if (_.isNumber(query.size)) {
        stmt.limit(query.size);
    }

    return db.query(stmt.toString()).then(function (rows) {
        return {results: rows};
    });
}

export function isDocumentExists(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        return db.query('SELECT COUNT(*) as count FROM document_http WHERE url LIKE $1', [url]).then((rows) => {
            return parseInt(rows[0].count) > 0 ? resolve() : reject();
        });
    });
}

export function getJsonDocumentsTypes(): Promise<any[]> {
    return db.query('SELECT type, COUNT(*) as count, MAX(ts) as last_change FROM document_json GROUP BY type');
}

export function getHttpDocument(name: string, offset: number): Promise<any> {
    return db.query('SELECT * FROM repo.document_http WHERE name LIKE $1  ORDER BY id OFFSET $2 LIMIT 1', [name, '' + offset]).then((results) => {
        return _.first(results);
    });
}

export function saveHttpDocument(data: IDocumentHttp): Promise<any[]> {
    const query = squel.insert().into('document_http').setFields(data).toParam();
    return db.query(query.text, query.values);
}

export function getHttpDocumentsSummary(): Promise<any[]> {
    const query = 'SELECT name, COUNT(*) as count, AVG(length)::bigint as avg_size, MAX(ts) as latest ' +
        'FROM document_http GROUP BY name';
    return db.query(query);
}

export function removeHttpDocumentsByName(name: string): Promise<any[]> {
    const query = 'DELETE FROM document_http WHERE name LIKE $1';
    return db.query(query, [name]);
}


