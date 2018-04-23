import {
    TaskDownload, TaskExtract, IJsonSearchConfig, TaskExportElasticsearch,
    TaskExportElasticsearchTargetConfig, TaskScript
} from "../../shared/typings";
import * as _ from "lodash";
import {getJsonDocuments} from "../../libs/repo";


export class DownloadBartoszDocumentsMeta extends TaskDownload {
    name = 'drugbase-bartosz-documents-meta';

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
        url: "http://localhost:9200",
        bulkSize: 200,
        indexName: 'drugbase-product',
        overwrite: true,
        mapping: {
            'drugbase-product': {
                dynamic: 'strict',
                properties: {
                    "code": {"type": "text"},
                    "bloz7": {"type": "keyword"},
                    "name": {"type": "text"},
                    "vendor": {"type": "keyword"},
                    "img": {"type": "keyword"},
                    "rx": {"type": "keyword"},
                    "free": {"type": "text"},
                    "senior75": {"type": "boolean"},
                    "refund": {"type": "boolean"},
                    "price": {"type": "float"},
                    "prices": {"type": "float"},
                    "fullPrice": {"type": "float"},
                    "repayment_F": {"type": "float"},
                    "repayment_R": {"type": "float"},
                    "repayment_30": {"type": "float"},
                    "repayment_50": {"type": "float"},
                    "repaymentLevel": {"type": "keyword"},
                    "range_30": {"type": "keyword"},
                    "range_30_S": {"type": "keyword"},
                    "range_50": {"type": "keyword"},
                    "range_F": {"type": "keyword"},
                    "range_R": {"type": "keyword"},
                    "range_R_S": {"type": "keyword"},
                    "indications": {"type": "text"},
                    "dosing": {"type": "text"},
                    "packaging": {"type": "keyword"},
                    "substance": {"type": "text"},
                    "pharmindex": {"type": "text"},
                    "chpl": {"type": "text"}
                }
            }
        }
    };
}

const fieldsMap = {
    rx: {
        "OTC": 'RX_OTC',
        "produkt wydawany z apteki na podstawie recepty": 'RX_RX',
        "produkt dostępny bez recepty": 'RX_NO',
        "produkt wydawany z apteki na podstawie recepty zastrzeżonej": 'RX_RESTRICTED',
        "produkt stosowany wyłącznie w lecznictwie zamkniętym": 'RX_CLOSED',
        "produkt wydawany z apteki na podstawie recepty z wtórnikiem": 'RX_REPEATER'
    },
    senior75: {
        "tak, we wskazaniach objętych refundacją.": true,
        "nie": false
    },
    refund: {
        "tak": true,
        "nie": false
    },
    repaymentLevel: {
        "ryczałt": [NaN],
        "30%": [30],
        "50%": [50],
        "bezpłatny,30%": [0, 30],
        "ryczałt,30%": [NaN, 30],
        "bezpłatny": [0],
        "bezpłatny,ryczałt": [0, NaN],
        "30%,50%": [30, 50],
        "bezpłatny,50%": [0, 50]
    }
};

export class GenerateMap extends TaskScript {
    script() {
        const esResponse = {};
        const data = _.get(esResponse, 'aggregations.count.buckets', []);
        const countsMap = _.reduce(data, (acc: any, bucket: any) => {
            _.set(acc, bucket.key, bucket.doc_count);
            return acc;
        }, {});
        console.log(JSON.stringify(countsMap, null, 4));
        return Promise.resolve();
    }
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
    'Wysokość dopłaty (ryczałt)': 'repayment_R',
    'Wysokość dopłaty (50%)': 'repayment_50',
    'Wysokość dopłaty (30%)': 'repayment_30',
    'Wysokość dopłaty (bezpłatny)': 'repayment_F',
    'Zakres wskazań objętych refundacją (bezpłatny )': 'range_F',
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
        const document: any = {};
        _.set(document, 'pharmindex', extracted.pharmindex);
        _.set(document, 'chpl', extracted.chpl);
        delete extracted.pharmindex;
        delete extracted.chpl;

        // Capture key value pairs via documents display texts mapping
        _.forEach(extracted, (rows) => {
            if (_.isEmpty(rows)) {
                return;
            }
            let displayText = _.trim(<string>_.first(rows));
            let value = _.trim(<string>_.last(rows));
            let key = _.get(displayTextMap, displayText);
            if (key) {
                document[<string>key] = <string>value;
            } else {
                console.error("Bartosz products not found product param on map", displayText);
            }
        });
        extracted = null;

        // Static map translation
        _.set(document, 'senior75', _.get(fieldsMap, `senior75[${document.senior75}]`, document.senior75));
        _.set(document, 'rx', _.get(fieldsMap, `rx[${document.rx}]`, document.rx));
        _.set(document, 'refund', _.get(fieldsMap, `refund[${document.refund}]`, document.refund));
        _.set(document, 'repaymentLevel', _.get(fieldsMap, `repaymentLevel[${document.repaymentLevel}]`, document.repaymentLevel));

        // Price conversion
        function castPrice(formattedString) {
            if (_.isEmpty(formattedString) || !_.isString(formattedString)) {
                return NaN;
            }
            return _.toNumber(formattedString.replace(' PLN', '').replace(',', '.')) || NaN;
        }

        _.set(document, 'price', castPrice(document.price));
        _.set(document, 'fullPrice', castPrice(document.fullPrice));
        _.set(document, 'repayment_R', castPrice(document.repayment_R));
        _.set(document, 'repayment_F', castPrice(document.repayment_F));
        _.set(document, 'repayment_30', castPrice(document.repayment_30));
        _.set(document, 'repayment_50', castPrice(document.repayment_50));
        return document;
    };
}
