'use strict';

import {TaskDownload, TaskExtract, IDocumentHttp, IJsonSearchConfig} from "../../shared/typings";
import * as _ from "lodash";
import {getJsonDocuments} from "../../libs/repo";
import * as Promise from 'bluebird';

let existsProductsCodes;

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
    name = 'foodbase-frisco';
    autoRemove = true;

    urls() {
        return frisco.fabloApi(5000, 1500000);
    };

    options = {
        headers: ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
            'Accept: application/json'],
    };
}
let i = 0;
export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-frisco'
    };
    targetJsonDocuments = {
        typeName: 'product',
    };

    process(extracted: any, doc: IDocumentHttp): any {
        const products = _.get(extracted, 'products.results', {}), results = [];
        let code;
        _.forEach(products, (product) => {
            code = _.get(product, 'attributes.ean[0]');
            if (!_.includes(existsProductsCodes, code)) {
                results.push({
                    code: code,
                    name: _.get(product, 'name'),
                    producer: _.get(product, 'attributes.producer[0]'),
                    brand: _.get(product, 'attributes.brand_name[0]'),
                    weight: _.get(product, 'human_grammage_gross[0]'),
                    imgAddress: _.get(product, 'images[0]'),
                    price: {
                        price: _.get(product, 'extra-info.orginal_price[0]'),
                        humanUnitPrice: _.get(product, 'extra-info.human_unit_price[0]')
                    },
                    sourceUrl: _.get(product, 'url'),
                    ingredients: _.get(product, 'extra-info.nutrient_elements[0]'),
                    ingredientsStrcut: _.get(product, 'extra-info.nutrient_elements[0]', '').split(/, ?/),
                    components: [],
                    queryCount: 0
                });
            } else {
                i++;
                console.log(`EAN ${code} already exists`);
                console.log(i);
            }
        });
        return results;
    };

    execute(): Promise<any> {
        const query: IJsonSearchConfig = {
            type: 'product',
            whitelist: ['code']
        };
        return getJsonDocuments(query).then((data) => {
            existsProductsCodes = _.map(data.results, 'body.code');
            return super.execute();
        });
    };
}
