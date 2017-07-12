import _ = require('lodash');
import {
    TaskDownload, TaskExportElasticsearch, TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";

export class download extends TaskDownload {
    name = 'stockbase-money-recommendations';

    urls() {
        return _.times(267, (i) => {
            return 'http://www.money.pl/gielda/rekomendacje/strona,' + i + '.html';
        });
    }
}

class exportProducts extends TaskExportElasticsearch {
    transform(document) {
        // todo handle many documents for export
        return document[0];
    }

    target: TaskExportElasticsearchTargetConfig = {
        url: 'http://elastic:changeme@vps404988.ovh.net:9200',
        // url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 50,
        indexName: 'recommendation',
        overwrite: true,
        mapping: {
            recommendation: {
                dynamic: 'strict',
                properties: {
                    symbol: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    type: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    current: {
                        type: 'float'
                    },
                    target: {
                        type: 'float'
                    },
                    diff: {
                        type: 'float'
                    },
                    publisher: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    date: {
                        type: 'date'
                    }
                }
            }
        }
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'stockbase-money-recommendations'
    };
    scope = 'table.rekomend tbody';
    map = {
        symbol: {
            singular: true,
            selector: 'tr td:nth-child(1)'
        },
        type: {
            singular: true,
            selector: 'tr td:nth-child(5)'
        },
        target: {
            singular: true,
            selector: 'tr td:nth-child(4)'
        },
        current: {
            singular: true,
            selector: 'tr td:nth-child(3)'
        },
        publisher: {
            singular: true,
            selector: 'tr td:nth-child(6)'
        },
        date: {
            singular: true,
            selector: 'tr td:nth-child(2)'
        }
    };

    process(extracted) {
        _.forEach(extracted, (row) => {
            row.current = parseFloat(row.current.replace(',', '.'));
            row.target = parseFloat(row.target.replace(',', '.'));
            row.diff = _.round(row.target - row.current, 4);
        });
        return extracted;
    };

    exportJsonDocuments = new exportProducts();
}
