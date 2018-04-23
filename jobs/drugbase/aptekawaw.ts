import {getJsonDocuments} from "../../libs/repo";
import {
    IJsonSearchConfig, TaskDownload, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";
import _ = require('lodash');
import {esHttpCall} from "../../libs/exporterElasticsearch";

export class DownloadAptekawawCategory extends TaskDownload {
    name = 'drugbase-aptekawaw-category-hrefs';
    autoRemove = true;

    urls() {
        return ['https://aptekawaw.pl/']
    };
}

export class ExtractAptekawawCategory extends TaskExtract {
    sourceHttpDocuments = {
        name: 'drugbase-aptekawaw-category-hrefs'
    };

    targetJsonDocuments = {
        typeName: 'drugbase-aptekawaw-category-hrefs',
        autoRemove: true
    };

    scope = '#naszaOfertaKontener .kategorie';
    map = {
        hrefs: {
            singular: false,
            attribute: 'href',
            selector: '.kategoria a'
        }
    };

    process(extracted) {
        const urls = _.get(extracted, '[0].hrefs', []);
        return _.chain(urls)
            .filter((url) => url.indexOf('_') === -1)
            .map((url) => {
                return {href: url}
            })
            .value();
    };
}

export class DownloadAptekawawProductsListsMeta extends TaskDownload {
    name = 'drugbase-aptekawaw-product-lists';
    options = {
        intervalTime: 500
    };

    autoRemove = false;

    urls() {
        const query: IJsonSearchConfig = {
            type: 'drugbase-aptekawaw-category-hrefs',
            sort: {id: 'ASC'}
        };
        return getJsonDocuments(query).then((data) => {
            return _.map(<any>_.get(data, 'results'), (d) => _.get(d, 'body.href'));
        });
    }
}

export class ExtractAptekawawProductCount extends TaskExtract {
    sourceHttpDocuments = {
        name: 'drugbase-aptekawaw-product-lists'
    };

    targetJsonDocuments = {
        typeName: 'drugbase-aptekawaw-product-counts',
        autoRemove: true
    };

    map = {
        count: {
            singular: true,
            selector: '#srodkowaKolumna div.main.clr div.boxTxt.flbox.clr > span:nth-child(1) > b:nth-child(3)'
        }
    };

    process(extracted, document, meta) {
        const count = parseInt(extracted.count);
        return {
            href: meta.url,
            count,
            pages: _.ceil(count / 20)
        };
    };
}

export class DownloadAptekawawProductsLists extends TaskDownload {
    name = 'drugbase-aptekawaw-product-lists';
    options = {
        intervalTime: 500
    };

    autoRemove = false;

    urls() {
        const query: IJsonSearchConfig = {
            type: 'drugbase-aptekawaw-product-counts',
            sort: {href: 'ASC'}
        };
        return getJsonDocuments(query).then((data) => {
            let results = [];
            _.forEach(data.results, (d) => {
                const href = _.get(d, 'body.href', '');
                const range = _.range(1, _.get(d, 'body.pages', 0) + 1);
                results = results.concat(_.chain(range).map((p) => `${href}?page=${p}&sort=1a`).value());
            });
            return results;
        });
    }
}

export class ExtractAptekawawProductMeta extends TaskExtract {
    sourceHttpDocuments = {
        name: 'drugbase-aptekawaw-product-lists'
    };

    targetJsonDocuments = {
        typeName: 'drugbase-aptekawaw-product-meta',
        autoRemove: true
    };

    map = {
        urls: {
            attribute: 'href',
            singular: false,
            selector: '#srodkowaKolumna .listing .boxProdSmall .przyciskiIkony a.wiecej'
        }
    };

    process(extracted, document, meta) {
        return _.map(_.get(extracted, 'urls', []), (url) => {
            const split = url.replace('-p-', '.').split('.');
            const id = _.get(split, `[${split.length - 2}]`);
            return {id};
        });
    };
}

export class DownloadAptekawawProducts extends TaskDownload {
    name = 'drugbase-aptekawaw-product';
    options = {
        headers: ['Content-Type: application/x-www-form-urlencoded'],
        intervalTime: 350
    };

    autoRemove = false;

    urls() {
        const query: IJsonSearchConfig = {
            type: 'drugbase-aptekawaw-product-meta',
            sort: {url: 'ASC'}
        };
        return getJsonDocuments(query).then((data) => _.map(data.results, (res) => {
            return {
                url: 'https://aptekawaw.pl/rpc.php?action=get_product_data',
                body: {products_id: _.get(res, 'body.id')}
            }
        }));
    }
}

export class DecorateProducts extends TaskExtract {
    esUrl = 'http://vps437867.ovh.net:9200';
    targetIndexName = 'drugbase-product';

    sourceHttpDocuments = {
        name: 'drugbase-aptekawaw-product'
    };

    // TODO change dc-server targetJsonDocuments should NOT be mandatory
    targetJsonDocuments = {
        typeName: 'product-source-1-x',
        autoRemove: true
    };

    process(aptekawawDecorationData) {
        const code = _.get(aptekawawDecorationData, 'ean');
        if (!code) {
            return Promise.resolve();
        }
        const payload = {
            query: {
                term: {
                    code: code
                }
            }
        };
        return esHttpCall(this.esUrl, this.targetIndexName + '/_search', 'POST', payload).spread((targetResults) => {
            const _id = _.get(targetResults, 'body.hits.hits[0]._id');
            const count = _.get(targetResults, 'body.hits.total');
            const targetProduct: any = _.get(targetResults, 'body.hits.hits[0]._source');
            if (count === 0) {
                return;
            }
            _.set(targetProduct, 'img', _.get(aptekawawDecorationData, 'images[0].image'));
            _.set(targetProduct, 'bloz7', _.get(aptekawawDecorationData, 'model'));
            const prices = [];
            if (_.get(targetProduct, 'price')) {
                prices.push(parseFloat(targetProduct.price))
            }
            if (_.get(aptekawawDecorationData, 'price')) {
                prices.push(parseFloat(aptekawawDecorationData.price))
            }
            _.set(targetProduct, 'prices', prices);

            process.stdout.write('.');
            return esHttpCall(this.esUrl, this.targetIndexName + '/' + this.targetIndexName + '/' + _id, 'PUT', targetProduct);
        }).then(() => true).catch((error) => {
            console.log('=== ERROR ON decorateProductIndex ===');
            console.error(error.toString());
            console.error(error);
        });
    };
}
