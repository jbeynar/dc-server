'use strict';

import {TaskDownload, TaskExtract, IDocumentHttp} from "../../shared/typings";
import * as _ from "lodash";
import {getJsonDocuments} from "../../libs/repo";
import * as Promise from 'bluebird';
import {isCodeExists} from "./shared";

const ecarrefourApi = {
    scroll: (slug, bulkSize, totalCount) => {
        return _.map(_.range(0, _.ceil(totalCount / bulkSize), 1), (page) => {
            return `https://www.ecarrefour.pl/web/product-views?categorySlugs=${slug}&page=${page}&resolveAttributes=true&resolveBrands=true&size=${bulkSize}&sort=-popularity`;
        });
    }
};

export class download extends TaskDownload {
    name = 'foodbase-carrefour';
    autoRemove = true;

    urls() {
        return _.concat(ecarrefourApi.scroll('napoje', 60, 900), ecarrefourApi.scroll('artykuly-spozywcze', 60, 5724));
    };

    options = {
        headers: ['Accept-Language: pl',
            'Accept: application/json, text/plain, */*',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
            'Referer: https://www.ecarrefour.pl/artykuly-spozywcze',
            'Cookie: SESSION=0e59e0b1-2f8f-4369-a44a-1a3d09b4a499; _ga=GA1.2.927337624.1485372457'],
    };
}

export class extractLinks extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-carrefour'
    };
    targetJsonDocuments = {
        typeName: 'foodbase-carrefourProductsLinks',
        autoRemove: true
    };

    process(extracted: any, doc: IDocumentHttp): any {
        const products = _.get(extracted, 'content', []), results = [];
        let code;

        return Promise.each(products, (product) => {
            code = _.get(product, 'product.code');
            return isCodeExists(code).then((ans) => {
                if (ans) {
                    console.log(`EAN ${code} already exists`);
                } else {
                    results.push({
                        slug: product.slug, url: 'https://www.ecarrefour.pl/web/product-views/' + product.slug
                    });
                }
            });
        }).then(() => results);
    };
}

export class downloadProducts extends TaskDownload {
    name = 'foodbase-carrefourProduct';
    autoRemove = true;

    urls() {
        return getJsonDocuments({type: 'foodbase-carrefourProductsLinks'}).then((carrefourProductsLinks) => {
            const results = [];
            _.forEach(carrefourProductsLinks.results, (item) => {
                if (_.get(item, 'body.url')) {
                    results.push(item.body.url);
                }
            });
            return results;
        });
    }

    options = {
        headers: ['Accept-Language: pl',
            'Accept: application/json, text/plain, */*',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
            'Referer: https://www.ecarrefour.pl/artykuly-spozywcze',
            'Cookie: SESSION=0e59e0b1-2f8f-4369-a44a-1a3d09b4a499; _ga=GA1.2.927337624.1485372457'],
    };
}

export class extractProducts extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-carrefourProduct'
    };
    targetJsonDocuments = {
        typeName: 'product',
    };

    process(extracted: any, doc: IDocumentHttp): any {
        let product, ingredients = '';
        const code = _.get(extracted, 'product.code');
        return isCodeExists(code).then((ans) => {
            if (ans) {
                console.log(`EAN ${code} already exists`);
                return;
            } else {
                const attribs = _.get(extracted, 'descriptionAttributeSets[0].descriptionAttributes', []);
                ingredients = _.get(_.find(attribs, (item) => item.name === 'Składniki'), 'value', '');
                product = {
                    code: code,
                    name: _.get(extracted, 'name'),
                    producer: _.get(extracted, 'brandView.name'),
                    brand: _.get(extracted, 'brandView.name'),
                    imgAddress: _.get(extracted, 'defaultImage.name'),
                    price: {
                        price: _.get(extracted, 'actualSku.amount.actualGrossPrice'),
                        humanUnitPrice: _.get(extracted, 'actualSku.grammageWithUnitString')
                    },
                    sourceUrl: doc.url,
                    ingredients: ingredients,
                    ingredientsStrcut: ingredients.split(/, ?/),
                    components: [],
                    queryCount: 0
                };
                return product;
            }
        });
    }
}
