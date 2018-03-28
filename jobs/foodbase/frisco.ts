import {
    IJsonSearchConfig,
    TaskDownload,
    TaskExportElasticsearch,
    TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";
import * as Promise from 'bluebird';
import * as http from 'http-as-promised';
import {getJsonDocuments} from "../../libs/repo";
const _ = require('lodash');

let categories = [];
const bulkSize = 200;

export class DownloadCategoriesIds extends TaskDownload {
    name = 'foodbase-frisco-categories-ids';
    autoRemove = true;

    urls() {
        return ['https://www.frisco.pl/'];
    };
}

export class ExtractCategories extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-frisco-categories-ids'
    };
    targetJsonDocuments = {
        typeName: 'foodbase-frisco-categories-ids',
        autoRemove: true
    };

    map = {
        categories: {
            attribute: 'href',
            selector: '.horizontal-navigation-bar_all-categories .horizontal-navigation-category .horizontal-navigation-category_categories a'
        }
    };

    process(extracted) {
        let categoriesIds = [];
        extracted.categories.forEach((path) => {
            let cid = _.get(path.match(/\/c,([0-9]*)\/cat,/), '[1]');
            if (cid) {
                categoriesIds.push(parseInt(<string>cid));
            }
        });
        categoriesIds = _.orderBy(_.uniq(categoriesIds), undefined);
        console.log('Downloading categories counts');
        return Promise.mapSeries(categoriesIds, (cid) => {
            let url = `https://commerce.frisco.pl/api/offer/categories/${cid}/products?pageSize=1&includeWineFacets=false&pageIndex=1`;
            return http.get(url).spread((result) => {
                return Promise.delay(25).then(() => {
                    process.stdout.write('.');
                    var obj = {
                        cid: cid,
                        count: _.get(JSON.parse(result.body), 'totalCount')
                    };
                    return obj;
                });
            });
        }).then((cats) => {
            process.stdout.write('\n');
            categories = cats;
            return {'categories': cats}
        });
    };
}

export class DownloadProductsLists extends TaskDownload {
    name = 'foodbase-frisco-products-lists';
    autoRemove = true;

    urls() {
        const urls = [];
        _.forEach(categories, (cat) => {
            const n = _.ceil(cat.count / bulkSize);
            _.times(n, (i) => {
                urls.push(`https://commerce.frisco.pl/api/offer/categories/${cat.cid}/products?pageSize=${bulkSize}&includeWineFacets=false&pageIndex=${i + 1}`);
            });
        });
        return urls;
    };
}

export class ExtractProductsMeta extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-frisco-products-lists'
    };
    targetJsonDocuments = {
        typeName: 'foodbase-frisco-products-meta',
        autoRemove: true
    };
    process(extracted) {
        const products = _.get(extracted, 'products', []);
        const data = _.map(products, (p) => {
            return {
                id: _.get(p, 'productId', ''),
                ean: _.get(p, 'product.ean', ''),
                name: _.get(p, 'product.name.pl', ''),
                imageUrl: _.get(p, 'product.imageUrl', ''),
                price: _.get(p, 'product.price.price', 0),
                categoryId: _.get(p, 'product.categories[0].categoryId', 0),
                categoryName: _.get(p, 'product.categories[0].name.en', 'N/A')
            }
        });
        return data;
    };

}

export class DownloadProducts extends TaskDownload {
    name = 'foodbase-frisco-products';
    urls() {
        const query: IJsonSearchConfig = {
            type: 'foodbase-frisco-products-meta',
            sort: {id: 'ASC'}
        };
        return getJsonDocuments(query).then((data) => {
            return _.map(data.results, (row) => {
                return {
                    url: `https://products.frisco.pl/api/products/get/${_.get(row, 'body.id')}`,
                    categoryId: _.get(row, 'body.categoryId'),
                    imageUrl: _.get(row, 'body.imageUrl')
                }
            });
        });
    }
}

class ExportProducts extends TaskExportElasticsearch {
    transform(dataset) {
        return dataset;
    }

    target: TaskExportElasticsearchTargetConfig = {
        url: "http://vps437867.ovh.net:9200",
        // url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 200,
        indexName: 'foodbase-products',
        overwrite: false,
        mapping: {
            'foodbase-products': {
                dynamic: false,
                properties: {
                    id: {
                        type: 'integer',
                        index: 'not_analyzed'
                    },
                    name: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    categoryId: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    imageUrl: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    ingredients: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    origin: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    language: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    source: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                }
            }
        }
    };
}

export class ExtractProducts extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-frisco-products'
    };
    exportJsonDocuments = new ExportProducts();

    process(extracted, doc, meta) {
        const ingredients = _.chain(extracted)
            .get('brandbank', [])
            .find({'sectionName': 'Składniki'})
            .get('fields', [])
            .find({'fieldId': 84})
            .get('content')
            .value();
        return {
            id: parseInt(_.get(extracted, 'productId')),
            name: _.get(extracted, 'seoData.title'),
            categoryId: parseInt(_.get(meta, 'metadata.categoryId', 0)),
            imageUrl: _.get(meta, 'metadata.imageUrl', ''),
            ingredients: ingredients,
            origin: 'pl',
            language: 'pl',
            source: 'FPL'
        };
    }
}
