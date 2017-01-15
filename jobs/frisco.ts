'use strict';

import {TaskDownload, TaskExtract, IDocumentHttp} from "../shared/typings";
import * as _ from "lodash";

export class download extends TaskDownload {
    name = 'frisco';
    autoRemove = true;

    urls() {
        return _.map(_.range(43300, 44300, 1), (i) => {
            return `https://www.frisco.pl/.api/product/productId,${i}`;
        });
    };

    options = {
        headers: ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
            'Accept: application/json'],
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'frisco'
    };
    targetJsonDocuments = {
        typeName: 'frisco',
        autoRemove: true
    };

    process(extracted: any, doc: IDocumentHttp): any {
        return _.get(extracted, 'data.product');
    }
}
