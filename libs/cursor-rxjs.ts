'use strict';

import {useFlavour} from 'squel';
import * as Cursor from 'pg-cursor';
import * as pg from 'pg';
import * as Rx from 'rxjs';
import * as db from "./db";
import * as _ from 'lodash';
import {config} from '../config';
import {IDocumentHttp} from "../shared/typings";

const squel = useFlavour('postgres');

function createRepoObservable(conditions): Rx.Observable<IDocumentHttp[]> {
    let cursor, readHandler;
    return Rx.Observable.create((subscriber) => {
        db.getClient().then((client: pg.Client) => {

            const query = squel.select().from(config.db.schema + '.document_http');
            _.each(conditions, (value, field) => {
                query.where(field + (_.isString(value) ? ' LIKE ?' : ' = ?'), value);
            });

            cursor = client.query(new Cursor(query.toString()));
            readHandler = function (err, rowsBulk) {
                if (err) {
                    console.error('cursor exception');
                    console.error(err);
                    subscriber.error(err);
                    return client.release();
                }

                if (!rowsBulk.length) {
                    subscriber.complete();
                    return client.release();
                }

                console.log('retrieved next bulk');
                subscriber.next(rowsBulk);
            };
            cursor.read(100, readHandler);
        });
    }).flatMap(() => {
        console.log('processing');
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        }).then(() => {
            console.log('DONE [OK]', Math.random());
            cursor.read(1000, readHandler);
            return true;
        });
    });
}

const extractionTask = {
    sourceHttpDocuments: {
        name: 'foodbase-alleceny'
    }
};

createRepoObservable(extractionTask.sourceHttpDocuments).subscribe(console.log);
