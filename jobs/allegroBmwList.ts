import _ = require('lodash');

import {ITaskDownload} from "../libs/downloader";
import {ITaskExtract} from "../libs/extractor";

export const download: ITaskDownload = {
    type: 'download',
    name: 'bmwList',
    urls: ['http://allegro.pl/seria-3-f30-2012-146802'],
    options: {
        headers: ['User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'],
        intervalTime: 500
    }
};

export const extract: ITaskExtract = {
    type: 'extract',
    sourceHttpDocuments: {
        host: 'allegro.pl'
    },
    targetJsonDocuments: {
        autoRemove: true,
        typeName: 'bmwList'
    },
    scope: '.offer',
    map: {
        link: {attribute: 'href', selector: '.offer-title', singular: true},
        title: {selector: '.offer-title', singular: true},
        price: {selector: '.offer-price .statement', singular: true},
        attribsKeys: '.offer-attributes dt',
        attribsValues: '.offer-attributes dd'
    },
    process: (extracted)=> {
        _.forEach(extracted, (e)=> {
            // todo .replace(/\[.*\]*/g, ' ')
            _.assign(e, _.zipObject(e.attribsKeys, e.attribsValues));
            delete e.attribsKeys;
            delete e.attribsValues;
        });
        return extracted;
    }
};
