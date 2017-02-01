'use strict';

import {TaskDownload, TaskExtract, IDocumentHttp, IJsonSearchConfig} from "../shared/typings";
import * as _ from "lodash";
import {getJsonDocuments} from "../libs/repo";
import * as Promise from 'bluebird';

let existsProductsEans;

const frisco = {
    friscoApi: () => { // note extraction path: return _.get(extracted, 'data.product', {});
        return _.map(_.range(43300, 44300, 1), (i) => {
            return `https://www.frisco.pl/.api/product/productId,${i}`;
        });
    },
    fabloApi: (bulkSize, totalCount) => {
        return _.map(_.range(0, totalCount, bulkSize), (offset) => {
            return `https://api.fablo.pl/api/2/frisco.pl/products/query?prefilter=status=0||3&&status=0||3&results=${bulkSize}&start=${offset}`;
        });
    }
};

export class download extends TaskDownload {
    name = 'frisco';
    autoRemove = true;

    urls() {
        return frisco.fabloApi(5000, 1500000);
    };

    options = {
        headers: ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
            'Accept: application/json'],
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'frisco'
    };
    targetJsonDocuments = {
        typeName: 'product',
    };

    process(extracted: any, doc: IDocumentHttp): any {
        const products = _.get(extracted, 'products.results', {}), results = [];
        let ean;
        _.forEach(products, (product) => {
            ean = _.get(product, 'attributes.ean[0]');
            if (!_.includes(existsProductsEans, ean)) {
                results.push({
                    ean: ean,
                    imgAddress: _.get(product, 'images[0]'),
                    ingredients: _.get(product, 'extra-info.nutrient_elements[0]'),
                    name: _.get(product, 'name'),
                    producer: _.get(product, 'attributes.producer[0]'),
                    sourceUrl: _.get(product, 'url'),
                    components: [],
                    queryCount: 0
                });
            }
        });
        return results;
    };

    execute(): Promise<any> {
        const query: IJsonSearchConfig = {
            type: 'product',
            whitelist: ['ean']
        };
        return getJsonDocuments(query).then((data) => {
            existsProductsEans = _.map(data.results, 'body.ean');
            return super.execute();
        });
    };
}
