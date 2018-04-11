import {getJsonDocuments} from "../../libs/repo";
import {
    IJsonSearchConfig, TaskDownload, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";
import _ = require('lodash');

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
        return _.map(_.get(extracted, 'urls', []), (url) => ({url}));
    };
}

export class DownloadAptekawawProducts extends TaskDownload {
    name = 'drugbase-aptekawaw-product';
    options = {
        intervalTime: 500
    };

    autoRemove: false;

    urls() {
        const query: IJsonSearchConfig = {
            type: 'drugbase-aptekawaw-product-meta',
            sort: {url: 'ASC'}
        };
        return getJsonDocuments(query).then((data) => _.map(data.results, 'body.url'));
    }
}

const productInfoLabelsMap = {
    "Kod:": 'id',
    "EAN:": 'code',
    "Producent:": 'vendor',
    "BLOZ7:": 'bloz7'
};

class ExportProducts extends TaskExportElasticsearch {
    transform(dataset) {
        return dataset;
    }

    target: TaskExportElasticsearchTargetConfig = {
        // url: "http://localhost:9200",
        url: 'http://vps437867.ovh.net:9200',
        bulkSize: 200,
        indexName: 'drugbase-product-img',
        overwrite: false,
        mapping: {
            'drugbase-product-img': {
                dynamic: true
            }
        }
    };
}

export class ExtractAptekawawProducts extends TaskExtract {
    sourceHttpDocuments = {
        name: 'drugbase-aptekawaw-product'
    };
    exportJsonDocuments = new ExportProducts();
    map = {
        title: {
            singular: true,
            selector: 'h1#nazwa_produktu'
        },
        img: {
            attribute: 'src',
            singular: true,
            selector: '#gallery img'
        },
        infoLabels: {
            singular: false,
            selector: '#szczegolyProduktu .informacje span.nazwa'
        },
        infoValues: {
            singular: false,
            selector: '#szczegolyProduktu .informacje span.wartosc'
        },
        price: {
            singular: true,
            selector: '#cena > span'
        }
    };

    process(extracted, d, m) {
        const keys = _.map(extracted.infoLabels, (label) => _.get(productInfoLabelsMap, label, label));
        if (keys.length != extracted.infoValues.length) {
            console.error("Product info data vectors different sizes");
        }
        const infoParams = _.zipObject(keys, _.map(extracted.infoValues, _.trim));
        delete extracted.infoValues;
        delete extracted.infoLabels;
        const product = _.assign(extracted, infoParams);
        const priceString = product.price.replace(' zł', '').replace(',', '.');
        _.set(product, 'price', _.toNumber(priceString));
        _.set(product, 'img', 'https://aptekawaw.pl/' + product.img.replace('images/min/product_min/', 'images/'));
        return product
    }
}
