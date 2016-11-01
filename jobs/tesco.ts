'use strict';

import {ITaskDownload} from "../libs/downloader";
import {ITaskExtract} from "../libs/extractor";

export const downloadLinks: ITaskDownload = {
    type: 'download',
    urls: ['https://ezakupy.tesco.pl/groceries/pl-PL/products/2003010544838']
}

export const extractLinks: ITaskExtract = {
    type: 'extract',
    sourceHttpDocuments: {
        host: 'ezakupy.tesco.pl'
    },
    targetJsonDocuments: {
        typeName: 'tescoLinks',
        autoRemove: true
    },
    map: {
        language: {
            selector: 'html',
            attribute: 'language'
        }
    },
    process: (res)=> {
        console.log('complete');
        console.log(res);
        return res;
    }
}
