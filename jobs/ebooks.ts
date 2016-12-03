"use strict";
import {TaskExtract, TaskDownload} from "../shared/typings";
const _ = require('lodash');
const fs_1 = require("fs");

export class download extends TaskDownload {
    name = 'ebooks';
    options = {
        headers: ['User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'],
        intervalTime: 500
    };

    urls() {
        return _.map(JSON.parse(fs_1.readFileSync(`/home/hakier/dev/projects/js/crawler/var/extracted.json`, 'utf8')).books, 'uri');
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        host: 'www.packtpub.com'
    };
    targetJsonDocuments = {
        autoRemove: true,
        typeName: 'ebooks'
    };
    map = {
        intro: {
            selector: '#mobile-book-container .book-top-block-info-one-liner',
            singular: true
        },
        description: {
            selector: '.book-info-bottom-indetail-text p',
        }
    };
}
