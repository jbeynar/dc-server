import _ = require('lodash');
import {
    TaskDownload,
    TaskExportElasticsearch,
    TaskExportElasticsearchTargetConfig,
    TaskExtract
} from "../../shared/typings";

export class download extends TaskDownload {
    name = 'stockbase-symbol';
    autoRemove = true;
    urls() {
        return ['http://www.biznesradar.pl/gielda/akcje_gpw'];
    }
}

class exportProducts extends TaskExportElasticsearch {
    transform(dataset) {
        return dataset;
    }
    target: TaskExportElasticsearchTargetConfig = {
        url: 'http://elastic:changeme@localhost:9200',
        bulkSize: 10,
        indexName: 'symbol',
        overwrite: true,
        mapping: {
            quotations: {
                dynamic: 'strict',
                properties: {
                    name: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    symbol: {
                        type: 'string',
                        index: 'not_analyzed'
                    }
                }
            }
        }
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'stockbase-symbol'
    };
    scope = 'table.qTableFull tr.soid';
    map = {
        name: {
            singular: true,
            selector: 'td:nth-child(1)',
            process: /^[A-Z\-0-9]{3,4}/
        },
        symbol: {
            singular: true,
            selector: 'td:nth-child(1) a',
            attribute: 'href',
            process: /[A-Z\-0-9]+$/
        }
    };
    exportJsonDocuments = new exportProducts();
}
