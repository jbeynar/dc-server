'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import db = require('../../libs/db');
import {
    TaskDownload, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";

const baseUrl = 'http://vitalia.pl/index.php/mid/90/fid/1047/kalorie/diety/product_id';

const harmityMap = {
    'Bezpieczny': 0,
    'Należy unikać': 1,
    'Zalecana ostrożność': 1,
    'Niezakazane': 1,
    'Dopuszczone z ograniczeniami': 1,
    'Niedopuszczone': 2,
    'Niekorzystny': 2,
    'Wycofany z użycia': 3,
    'Niebezpieczny': 3,
    'Niebezpieczny, Wycofany z użycia': 3
};

export class download extends TaskDownload {
    name = 'foodbase-vitalia';

    urls() {
        return _.times(818, i => [baseUrl, '/', i].join(''));
    };

    options: {
        headers: ['User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'],
        intervalTime: 500
    }
}

class esExport extends TaskExportElasticsearch {
    transform(document) {
        return Promise.resolve(document);
    }

    target: TaskExportElasticsearchTargetConfig = {
        url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 50,
        indexName: 'ingredient',
        overwrite: true,
        mapping: {
            product: {
                dynamic: 'strict',
                properties: {
                    name: {
                        type: 'string',
                    },
                    code: {
                        type: 'string'
                    },
                    names: {
                        type: 'string'
                    },
                    category: {
                        type: 'string'
                    },
                    purpose: {
                        type: 'string'
                    },
                    rating: {
                        type: 'float',
                    }
                }
            }
        }
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-vitalia'
    };

    map = {
        primaryNames: {
            singular: true,
            selector: '.widecolumn>h1',
            process: (text) => {
                text = text.replace('Informacje o dodatku: ', '');
                var matches = text.match(/([^ ].*[^ ]) *\( ?([^ ].*[^ ]) ?\)/);
                var names: any = {};
                if (matches) {
                    names.name = matches[1];
                    names.code = matches[2];
                }
                return names;
            }
        },
        secondaryNames: {
            singular: true,
            selector: '.widecolumn>h2',
            process: (text) => {
                text = text.replace(/Inne nazwy: /, '');
                var matches = text.match(/([^,()])+/g);
                return _.map(matches, (match: string) => {
                    return match.trim();
                });
            }
        },
        category: {
            singular: true,
            selector: 'table.sortabless tr:nth-child(2) td:nth-child(1)'
        },
        purpose: {
            singular: true,
            selector: 'table.sortabless tr:nth-child(2) td:nth-child(2)'
        },
        rating: {
            singular: true,
            selector: 'table.sortabless tr:nth-child(2) td:nth-child(3)',
            process: (text) => {
                return harmityMap[text];
            },
            default: 0
        }
    };

    process(extracted, doc) {
        if (!_.get(extracted, 'primaryNames.name')) {
            return;
        }
        if ('E' !== _.get(extracted, 'primaryNames.code[0]')) {
            return;
        }
        extracted.name = extracted.primaryNames.name;
        extracted.code = extracted.primaryNames.code;
        extracted.names = [extracted.name, extracted.code];
        if (extracted.secondaryNames) {
            extracted.names = extracted.names.concat(extracted.secondaryNames);
        }
        delete extracted.primaryNames;
        delete extracted.secondaryNames;
        return extracted;
    };

    exportJsonDocuments = new esExport();
}
