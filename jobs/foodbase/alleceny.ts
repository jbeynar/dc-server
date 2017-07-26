'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import db = require('../../libs/db');
import {
    TaskDownload,
    TaskExtract,
    TaskExportElasticsearch,
    TaskExportElasticsearchTargetConfig, IDocumentHttp
} from "../../shared/typings";

export class download extends TaskDownload {
    name = 'foodbase-alleceny';

    urls() {
        return _.map(_.range(1, 10000), (i) => `http://www.alleceny.pl/produkt/${i}/a`)
    };

    options = {
        headers: ['Host: www.alleceny.pl',
            'Referer: http://www.alleceny.pl',
            'Connection: keep-alive',
            'Cache-Control: max-age=0',
            'Upgrade-Insecure-Requests: 1',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language: pl',
            'Cookie: PHPSESSID=n35noqf9lmlm70peoi8hhkime6; grey_wizard=%2BqQzF2OI5kpFHrijKBL%2FiLvGcmeIrmsEBoLn1l5pOMROXnUA2g%2B%2B5oGf7mNZ9TDNodtKAhKB8vdERZP283fDSm2dSDLnDN6nS9vpQ%2B9j4Vg%3D; _gat=1; _ga=GA1.2.2091708389.1493022157; _gid=GA1.2.1000376719.1501059718; _gat_UA-19035528-6=1'],
        intervalTime: 1250
    }
}

// TODO bump node + npm version and reinstall npm module
class exportProducts extends TaskExportElasticsearch {
    sourceJsonDocuments = {
        typeName: 'foodbase-alleceny'
    };

    transform(document) {
        const fields = ['group', 'name', 'brand', 'ingredients', 'nutrition', 'producerAddress', 'sourceTs'];
        return Promise.resolve(_.pick(document, fields));
    }

    target: TaskExportElasticsearchTargetConfig = {
        url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 10,
        indexName: 'product',
        overwrite: true,
        mapping: {
            product: {
                dynamic: 'strict',
                properties: {
                    name: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    group: {
                        type: 'string'
                    },
                    brand: {
                        type: 'string'
                    },
                    producerAddress: {
                        type: 'string'
                    },
                    ingredients: {
                        type: 'string'
                    },
                    nutrition: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    sourceTs: {
                        type: 'date'
                    }
                }
            }
        }
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-alleceny'
    };

    map = {
        name: {
            singular: true,
            selector: 'h1.productname'
        },
        ingredients: {
            singular: false,
            selector: 'h2:contains("Składniki") ~ ul>li'
        },
        features: {
            singular: false,
            selector: 'h3:contains("Cechy") ~ ul>li'
        },
        nutrition: {
            type: 'html',
            singular: false,
            selector: 'h3:contains("Wartości odżywcze") ~ table'
        },
        producerAddress: {
            singular: true,
            selector: 'h3:contains("Adres producenta") ~ p'
        },
        brand: {
            singular: true,
            selector: '.productInfoComponent .buttons-group ~ p>a:first-child'
        },
        group: {
            singular: true,
            selector: '.productInfoComponent .buttons-group ~ p>a:last-child'
        },
        priceLow: {
            singular: true,
            selector: '.priceBox>div:first-child p'
        },
        priceHigh: {
            singular: true,
            selector: '.priceBox>div:nth-child(2) p:first-child strong'
        },
        image: {
            singular: true,
            selector: '.zoom .fancybox',
            attribute: 'href'
        }
    };

    process(extracted, doc, metadata): any {
        extracted.nutrition = '<table>' + extracted.nutrition + '</table>';
        extracted.sourceTs = metadata.ts;
        return extracted;
    };

    exportJsonDocuments = new exportProducts();
}
