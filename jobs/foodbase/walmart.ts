import {
    IJsonSearchConfig, TaskDownload, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";
import {getJsonDocuments} from "../../libs/repo";

const _ = require('lodash');

export class DownloadFoodCategories extends TaskDownload {
    name = 'foodbase-walmart-food-categories';

    urls() {
        return ['https://www.walmart.com/cp/food/976759']
    };
}


export class ExtractFoodCategories extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-walmart-food-categories'
    };
    targetJsonDocuments = {
        typeName: 'foodbase-walmart-food-categories',
        autoRemove: true
    };

    map = {
        path: {
            selector: 'li a[role="menuitem"]',
            attribute: 'href'
        },
        name: {
            selector: 'li a[role="menuitem"]'
        }
    };

    process(extracted) {
        return _.zipWith(extracted.name, extracted.path, (n, p) => {
            let categoryPath = _.chain(p)
                .split('/')
                .last({})
                .value();
            return {name: n, path: p, categoryPath: categoryPath}
        });
    };
}


export class DownloadFood extends TaskDownload {
    name = 'foodbase-walmart-food';
    options = {
        intervalTime: 900
    };

    urls() {
        const query: IJsonSearchConfig = {
            type: 'foodbase-walmart-food-categories',
            sort: {id: 'ASC'}
        };
        return getJsonDocuments(query).then((data) => {
            let urls = [];
            _.forEach(data.results, (row) => {
                let d = _.get(row, 'body');
                let id = _.get(d, 'categoryPath');
                let n = 15;
                _.times(n, (i) => {
                    urls.push({
                        id: id,
                        name: _.get(d, 'name'),
                        url: `https://www.walmart.com/search/api/preso?cat_id=${id}&prg=desktop&page=${i + 1}`
                    });
                });
            });
            return _.chain(urls)
                .uniq()
                .filter((item) => !_.isUndefined(item.id))
                .value();
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
        overwrite: true,
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
                    code: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    codeType: {
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
        name: 'foodbase-walmart-food'
    };

    exportJsonDocuments = new ExportProducts();

    process(extracted, document, meta) {
        return _.map(extracted.items, (d) => {
            return {
                id: parseInt(_.get(d, 'usItemId')),
                name: _.get(d, 'title'),
                categoryId: _.get(meta, 'metadata.id'),
                imageUrl: _.get(d, 'imageUrl'),
                code: _.get(d, 'upc'),
                codeType: 'upc',
                ingredients: [],
                origin: 'us',
                language: 'en',
                source: 'WMS'
            };
        });
    };
}

