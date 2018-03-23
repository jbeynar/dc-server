import {
    TaskDownload, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";
// import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as http from 'http-as-promised';

const _ = require('lodash');

let categories = [];
const bulkSize = 200;

export class downloadCategoriesIds extends TaskDownload {
    name = 'frisco-categories-ids';
    autoRemove = true;

    urls() {
        return ['https://www.frisco.pl/'];
    };
}

export class extractCategories extends TaskExtract {
    sourceHttpDocuments = {
        name: 'frisco-categories-ids'
    };
    targetJsonDocuments = {
        typeName: 'frisco-categories-ids',
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

export class downloadProductsLists extends TaskDownload {
    name = 'frisco-products-lists';
    autoRemove = true;

    urls() {
        const urls = [];
        console.log('start generating urls');
        _.forEach(categories, (cat) => {
            const n = _.ceil(cat.count / bulkSize);
            _.times(n, (i) => {
                urls.push(`https://commerce.frisco.pl/api/offer/categories/${cat.cid}/products?pageSize=${bulkSize}&includeWineFacets=false&pageIndex=${i + 1}`);
            });
        });
        console.log('generated', urls.length);
        return urls;
    };
}

class exportProductsIds extends TaskExportElasticsearch {
    transform(dataset) {
        return dataset;
    }

    target: TaskExportElasticsearchTargetConfig = {
        url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 200,
        indexName: 'foodbasebase-frisco-products-ids',
        overwrite: true,
        mapping: {
            'foodbasebase-frisco-products-ids': {
                dynamic: 'strict',
                properties: {
                    id: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    ean: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    name: {
                        type: 'string',
                        index: 'not_analyzed'
                    }
                }
            }
        }
    };
}

export class extractProductsLists extends TaskExtract {
    sourceHttpDocuments = {
        name: 'frisco-products-lists'
    };

    exportJsonDocuments = new exportProductsIds();

    process(extracted) {
        const products = _.get(extracted, 'products', []);
        const data = _.map(products, (p) => {
            return {
                id: _.get(p, 'productId', ''),
                ean: _.get(p, 'product.ean', ''),
                name: _.get(p, 'product.name.pl', '')
            }
        });
        return data;
    };

}

export class downloadProducts extends TaskDownload {
    name = 'foodbase-frisco-products';
    autoRemove = true;

    urls() {
        const url = 'http://localhost:9200/foodbasebase-frisco-products-ids/_search?_source=id&size=10000';
        return http.get(url).spread((result) => {
            const ids = _.map(_.get(JSON.parse(result.body), 'hits.hits', []), (doc) => {
                return _.get(doc, '_source.id', undefined);
            });
            return _.map(ids, (id) => {
                return `https://products.frisco.pl/api/products/get/${id}`;
            });
        });
    };
}

class exportProducts extends TaskExportElasticsearch {
    transform(dataset) {
        return dataset;
    }

    target: TaskExportElasticsearchTargetConfig = {
        url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 200,
        indexName: 'foodbasebase-products',
        overwrite: true,
        mapping: {
            'foodbasebase-products': {
                dynamic: 'strict',
                properties: {
                    id: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    name: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    ingredients: {
                        type: 'string',
                        index: 'not_analyzed'
                    }
                }
            }
        }
    };
}

export class extractProducts extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-frisco-products'
    };

    exportJsonDocuments = new exportProducts();

    process(extracted) {
        const ingredients = _.chain(extracted)
            .get('brandbank', [])
            .find({'sectionName': 'Składniki'})
            .get('fields', [])
            .find({'fieldId': 84})
            .get('content')
            .value();
        const data = {
            id: _.get(extracted, 'productId'),
            name: _.get(extracted, 'seoData.title'),
            ingredients: ingredients
        };
        return data;
    }
}

