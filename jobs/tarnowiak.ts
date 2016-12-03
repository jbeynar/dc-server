'use strict';

import {TaskDownload, TaskExtract} from "../shared/typings";

export class download extends TaskDownload {
    name = 'tarnowiak';

    urls() {
        return ['http://www.tarnowiak.pl/']
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        host: 'www.tarnowiak.pl'
    };
    targetJsonDocuments = {
        typeName: 'tarnowiak',
        autoRemove: true
    };
    scope = '#content div.box_content_info';
    map = {
        name: {
            singular: true,
            selector: 'div.box_content_desc > strong'
        },
        link: {
            singular: true,
            selector: 'p>a',
            attribute: 'href'
        }
    };
}
