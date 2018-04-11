import {
    TaskDownload, TaskExtract, IJsonSearchConfig, TaskExportElasticsearch,
    TaskExportElasticsearchTargetConfig
} from "../../shared/typings";
import _ = require('lodash');
import {getJsonDocuments} from "../../libs/repo";


export class DownloadBartoszDocumentsMeta extends TaskDownload {
    name = 'drugbase-bartosz-documents-meta';

    // autoRemove = true;

    urls() {
        return _.map(_.range(613), (v) => {
            return `http://www.bartoszmowi.pl/phx_drugs/glossary/page:${v}`
        })
    };
}

export class ExtractBartoszDocumentsMeta extends TaskExtract {
    sourceHttpDocuments = {
        name: 'drugbase-bartosz-documents-meta'
    };
    targetJsonDocuments = {
        typeName: 'drugbase-bartosz-products-meta',
        autoRemove: true
    };

    scope = '#phx-glossary-sorting tr';
    map = {
        href: {
            singular: true,
            attribute: 'href',
            selector: 'td:first-child a'
        }
    };


    process(extracted) {
        return _.map(extracted, (v) => {
            return {
                id: parseInt(_.get(v, 'href', '').replace('/phx_preparat/', ''))
            }
        });
    };
}

export class DownloadBartoszDocuments extends TaskDownload {
    name = 'drugbase-bartosz-products';
    // autoRemove = true;
    options = {
        intervalTime: 500
    };

    urls() {
        const query: IJsonSearchConfig = {
            type: 'drugbase-bartosz-products-meta',
            sort: {id: 'ASC'}
        };
        return getJsonDocuments(query).then((data) => {
            return _.chain(data.results)
                .map((row) => {
                    let id = _.get(row, 'body.id');
                    return `http://www.bartoszmowi.pl/phx_preparat/${id}`
                })
                .uniq()
                .value();
        });
    }
}

class ExportProducts extends TaskExportElasticsearch {
    transform(dataset) {
        return dataset;
    }

    target: TaskExportElasticsearchTargetConfig = {
        // url: "http://localhost:9200",
        url: 'http://vps437867.ovh.net:9200',
        bulkSize: 200,
        indexName: 'drugbase-product',
        overwrite: false,
        mapping: {
            'drugbase-product': {
                dynamic: true
            }
        }
    };
}

const displayTextMap = {
    'Substancja czynna': 'substance',
    'Nazwa preparatu': 'name',
    'Producent': 'vendor',
    'Zawartość opakowania': 'packaging',
    'Kod EAN': 'code',
    'Refundowany': 'refund',
    'Bepłatny dla seniorów 75+': 'senior75',
    'Recepta': 'rx',
    'Cena': 'price',
    'Wskazania (w tym pkt 4.1 ChPL)': 'indications',
    'Dawkowanie': 'dosing',
    'Poziom odpłatnosci': 'repaymentLevel',
    'Cena pełnopłatna': 'fullPrice',
    'Wysokość dopłaty (ryczałt)': 'repayment',
    'Wysokość dopłaty (50%)': 'repayment50',
    'Wysokość dopłaty (30%)': 'repayment30',
    'Wysokość dopłaty (bezpłatny)': 'free',
    'Zakres wskazań objętych refundacją (bezpłatny )': 'range_Free',
    'Zakres wskazań objętych refundacją (ryczałt  i S)': 'range_R_S',
    'Zakres wskazań objętych refundacją (30%  i S)': 'range_30_S',
    'Zakres wskazań objętych refundacją (ryczałt )': 'range_R',
    'Zakres wskazań objętych refundacją (50% )': 'range_50',
    'Zakres wskazań objętych refundacją (30% )': 'range_30'
};

export class ExtractBartoszDocuments extends TaskExtract {
    sourceHttpDocuments = {
        name: 'drugbase-bartosz-products'
    };
    exportJsonDocuments = new ExportProducts();
    map = {
        r1: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(1) th, div.textContent table.listaLeft.listaLeft tr:nth-child(1) td"
        },
        r2: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(2) th, div.textContent table.listaLeft.listaLeft tr:nth-child(2) td"
        },
        r3: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(3) th, div.textContent table.listaLeft.listaLeft tr:nth-child(3) td"
        },
        r4: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(4) th, div.textContent table.listaLeft.listaLeft tr:nth-child(4) td"
        },
        r5: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(5) th, div.textContent table.listaLeft.listaLeft tr:nth-child(5) td"
        },
        r6: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(6) th, div.textContent table.listaLeft.listaLeft tr:nth-child(6) td"
        },
        r7: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(7) th, div.textContent table.listaLeft.listaLeft tr:nth-child(7) td"
        },
        r8: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(8) th, div.textContent table.listaLeft.listaLeft tr:nth-child(8) td"
        },
        r9: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(9) th, div.textContent table.listaLeft.listaLeft tr:nth-child(9) td"
        },
        r10: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(10) th, div.textContent table.listaLeft.listaLeft tr:nth-child(10) td"
        },
        r11: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(11) th, div.textContent table.listaLeft.listaLeft tr:nth-child(11) td"
        },
        r12: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(12) th, div.textContent table.listaLeft.listaLeft tr:nth-child(12) td"
        },
        r13: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(13) th, div.textContent table.listaLeft.listaLeft tr:nth-child(13) td"
        },
        r14: {
            singular: false,
            selector: "div.textContent table.listaLeft.listaLeft tr:nth-child(14) th, div.textContent table.listaLeft.listaLeft tr:nth-child(14) td"
        },
        pharmindex: {
            attribute: 'href',
            singular: true,
            selector: "div.textContent table.listaLeft.listaLeft tr a:contains('Kompletny opis preparatu na pharmindex.pl')"
        },
        chpl: {
            attribute: 'href',
            singular: true,
            selector: "div.textContent table.listaLeft.listaLeft tr a:contains('Otwórz ChPL')"
        },

    };

    process(extracted) {
        const document = {};
        _.set(document, 'pharmindex', extracted.pharmindex);
        _.set(document, 'chpl', extracted.chpl);
        delete extracted.pharmindex;
        delete extracted.chpl;
        _.forEach(extracted, (rows, index) => {
            if (!_.isEmpty(rows)) {
                let displayText = _.trim(<string>_.first(rows));
                let value = _.trim(<string>_.last(rows));
                let key = _.get(displayTextMap, displayText);
                if (key) {
                    document[<string>key] = <string>value;
                } else {
                    // TODO investigate here for more data
                    // console.error("Bartosz products not found product param on map");
                    // console.log(displayText);
                    // console.log('VALUE=', value);
                }
            }
        });
        return document;
    };
}
