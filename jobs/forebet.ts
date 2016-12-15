'use strict';

import {TaskDownload, TaskExtract} from "../shared/typings";

export class download extends TaskDownload {
    name = 'forebet';
    autoRemove = true;

    urls() {
        return ['http://www.forebet.com/pl/prognozy-pi%C5%82karskie-na-dzi%C5%9B']
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        host: 'www.forebet.com'
    };
    targetJsonDocuments = {
        typeName: 'forebet',
        autoRemove: true
    };
    scope = 'table.schema tr';
    map = {
        name: {
            singular: true,
            selector: 'td:nth-child(1) a'
        },
        propability1: {
            singular: true,
            selector: 'td:nth-child(2)'
        },
        propability2: {
            singular: true,
            selector: 'td:nth-child(3)'
        },
        propability3: {
            singular: true,
            selector: 'td:nth-child(4)'
        },
        score: {
            singular: true,
            selector: 'td:nth-child(5)'
        },
        goals: {
            singular: true,
            selector: 'td:nth-child(6)'
        },
        forecast: {
            singular: true,
            selector: 'td:nth-child(7)'
        },
        odds: {
            singular: true,
            selector: 'td:nth-child(8)'
        },
        result: {
            singular: true,
            selector: 'td:nth-child(9)'
        }
    };
}
