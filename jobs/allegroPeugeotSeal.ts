'use strict';

import _ = require('lodash');
import {TaskExtract, TaskDownload} from "../shared/typings";

export class download extends TaskDownload {
    urls() {
        return ['http://allegro.pl/listing/listing.php?order=p&string=peugeot+306+uszczelka+drzwi&bmatch=base-relevance-floki-5-uni-1-1-1025&ref=fq_mp_title'];
    };
    options = {
        headers: ['User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'],
        intervalTime: 500
    };
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        host: 'allegro.pl'
    };
    targetJsonDocuments = {
        autoRemove: true,
        typeName: 'peugeotSeal'
    };
    scope= '.offer';
    map= {
        link: { attribute: 'href', selector: '.offer-title', singular: true },
        title: { selector: '.offer-title', singular: true },
        price: { selector: '.offer-price .statement', singular: true, process: (value) => value.replace() },
        attribsKeys: '.offer-attributes dt',
        attribsValues: '.offer-attributes dd'
    };
    process(extracted) {
        return _.map(extracted, (e : any) => {
            // todo .replace(/\[.*\]*/g, ' ')
            _.assign(e, _.zipObject(e.attribsKeys, e.attribsValues));
            delete e.attribsKeys;
            delete e.attribsValues;
            e.match = _([/(lew[a-z]*)/i, /(praw[a-z]*)/i, /(ty[lł][a-z]*)/i, /(prz[a-z]*)/i]).map((pattern) => {
                let match = e.title.match(pattern);
                return match && match[0].toLowerCase();
            }).uniq().compact().value().join(',');
            if (!e.price.match('kup teraz')) {
                return;
            }
            return e;
        });
    }
}
