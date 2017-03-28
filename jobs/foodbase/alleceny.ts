'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import db = require('../../libs/db');
import {TaskDownload, TaskExtract, TaskExportElasticsearch} from "../../shared/typings";

export class download extends TaskDownload {
    name = 'foodbase-alleceny';

    urls() {
        throw new Error('Are you sure?');
        // return _.times(50000, i => `http://www.alleceny.pl/produkt/${i}/soplica_szlachetna_wodka_1_l`);
    };

    options: {
        headers: ['Accept-Encoding: gzip, deflate, sdch',
            'Accept-Language: pl',
            'Upgrade-Insecure-Requests: 1',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Cache-Control: max-age=0',
            'Cookie: PHPSESSID=einuuooas1toddvg843agd3rp4; modal-info=true; grey_wizard=epOHw%2F98%2Bg%2FVY4Mflp4XtduWWQcfTzQtIyZRvhdFoOi4mXhHTYk3qIqMgqpT9vT4%2B7cAReSL01LkkWxEqfoMYw%3D%3D; _gat=1; _ga=GA1.2.632424612.1486160804',
            'Connection: keep-alive'],
        intervalTime: 500
    }
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-alleceny'
    };
    targetJsonDocuments = {
        typeName: 'foodbase-alleceny',
        autoRemove: true
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
            singular: false,
            selector: 'h3:contains("Wartości odżywcze") ~ table>tbody>tr>*'
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
}


export class exportProducts extends TaskExportElasticsearch {
    sourceJsonDocuments = {
        typeName: 'foodbase-alleceny'
    };

    transform(document) {
        return Promise.resolve(_.pick(document.body, ['name', 'brand', 'ingredients']));
    }

    target = {
        url: 'http://localhost:9200',
        bulkSize: 1000,
        indexName: 'product',
        mapping: {
            product: {
                dynamic: 'strict',
                properties: {
                    name: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    brand: {
                        type: 'string'
                    },
                    ingredients: {
                        type: 'string'
                    }
                }
            }
        }
    };
}
