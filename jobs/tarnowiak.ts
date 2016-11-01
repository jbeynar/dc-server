'use strict';
import {ITaskDownload} from "../libs/downloader";
import {ITaskExtract} from "../libs/extractor";

export const download: ITaskDownload = {
    type: 'download',
    urls: ['http://www.tarnowiak.pl/']
};

export const extract: ITaskExtract = {
    type: 'extract',
    sourceHttpDocuments: {
        host: 'www.tarnowiak.pl'
    },
    targetJsonDocuments: {
        typeName: 'tarnowiak',
        autoRemove: true
    },
    scope: '#content div.box_content_info',
    map: {
        name: {
            singular: true,
            selector: 'div.box_content_desc > strong'
        }
    }
};
