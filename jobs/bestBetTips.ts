'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import pg = require('pg-rxjs');
import {config} from '../config';
import db = require('../libs/db');
import {TaskDownload, TaskExtract, TaskExportCsv, TaskExport} from "../shared/typings";

export class download extends TaskDownload {
    name = 'bestBetTips';

    urls() {
        return _.times(222, (i) => {
            const limitstart = i * 100;
            // return `http://bestbet.tips/tipsters/tipster/7?start=0&limitstart=${limitstart}#.WFWIRLYrJ-X`;
            return `http://bestbet.tips/latest-betting-tips?start=${limitstart}#.WFgth3eZMdW`;
        });
    };

    options = {
        headers: ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'],
        intervalTime: 500
    }
}

function cleanup(str) {
    if (_.isString(str)) {
        return str.replace(/[\n\r]*/g, '').trim();
    }
    return str;
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'bestBetTips'
    };
    targetJsonDocuments = {
        typeName: 'bestBetTips',
        autoRemove: true
    };
    scope = 'form table.betting tbody tr';
    map = {
        sport: {
            selector: 'td:nth-child(1) a span img:first-child',
            attribute: 'title',
            singular: true,
            process: cleanup
        },
        country: {
            selector: 'td:nth-child(1) a span img:last-child',
            attribute: 'title',
            singular: true,
            process: cleanup
        },
        event: {
            selector: 'td:nth-child(2)',
            singular: true,
            process: cleanup
        },
        user: {
            selector: 'td:nth-child(3)',
            singular: true,
            process: cleanup
        },
        odds: {
            selector: 'td:nth-child(4)',
            singular: true,
            process: cleanup
        },
        stake: {
            selector: 'td:nth-child(5)',
            singular: true,
            process: cleanup
        },
        result: {
            selector: 'td:nth-child(6)',
            singular: true,
            process: cleanup
        }
    };
}

export class exportCsv extends TaskExportCsv {
    sourceTypeName = 'bestBetTips';
}

export class exportDatabase extends TaskExport {
    sourceJsonDocuments = {
        typeName: 'bestBetTips',
        order: 'bet'
    };
    targetMongo = {
        url: 'mongodb://heroku_h2nc9ljs:5fis29jmm8cup2ucucqq0dih8f@ds135818.mlab.com:35818/heroku_h2nc9ljs',
        collectionName: 'tip',
        autoRemove: true
    };
}
