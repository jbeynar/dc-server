"use strict";

import * as  _ from 'lodash';
import {TaskDownload, TaskExtract} from "../shared/typings";

export class download extends TaskDownload {
    name = 'oculist';
    type = 'download';

    urls() {
        return _.times(17, (i) => `https://swiatprzychodni.pl/specjalnosci/okulista/malopolskie/${i + 1}/?s=miejsce`);
    }

    options = {
        headers: ['User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'],
        intervalTime: 500
    }
}

export class extract extends TaskExtract {
    type= 'TaskExtract';
    sourceHttpDocuments= {
        host: 'swiatprzychodni.pl'
    };
    targetJsonDocuments={
        autoRemove: true,
        typeName: 'oculist'
    };
    scope= '.details';
    map= {
        days: 'span.days',
        links: {
            selector: 'ul li > a',
            attribute: 'href'
        },
        address: '.address .address',
    };
    process(docs) {
        _.each(docs, (doc) => {
            doc.days = parseInt(_.min(_.map(doc.days, (days : string) => days.replace(' dni', '').toString())));
            doc.links = _.map(doc.links, (link) => `https://swiatprzychodni.pl${link}`).join('   ');
        });
        return docs;
    }
}
