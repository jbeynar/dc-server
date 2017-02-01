'use strict';

import * as Rx from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as pg from 'pg';
import * as db from '../libs/db';
import * as repo from '../libs/repo';
import {config} from '../config';
import {TaskDownload, TaskExtract, TaskScript, TaskExport} from "../shared/typings";
import {log} from "../libs/logger";

const baseUrl = 'https://ezakupy.tesco.pl/groceries/pl-PL/shop/art.-spozywcze/all?page=';

const tescoLinksSourcesUrls = {
    favorites: _.map(['bounty', 'hit', 'pudliszki', 'pudliszki&page=2',
            'kabanosy', 'kabanosy&page=2', 'winiary', 'winiary&page=2', 'winiary&page=3', 'winiary&page=4',
            'winiary&page=5', 'winiary&page=6', 'lisner', 'lisner&page=2', 'lisner&page=3',
            'lisner&page=4', 'kinder', 'roleski', 'wawel', 'wawel&page=2', 'wawel&page=3',
            'mlekovita', 'mlekovita&page=2', 'mlekovita&page=3', 'łosoś',
            'łosoś&page=2', 'piątnica', 'piątnica&page=2', 'masło',
            'kabanosy&page=3', 'kabanosy&page=4'],
        item => 'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=' + item),
    range: ()=> {
        return _.map(_.range(1, 243, 1), k=>baseUrl + k);
    }
};

export class download extends TaskDownload {
    name = 'tescoLinks';
    autoRemove = true;

    urls() {
        return tescoLinksSourcesUrls.range();
    }
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'tescoLinks'
    };
    targetJsonDocuments = {
        typeName: 'tescoLinks',
        autoRemove: true
    };
    map = {
        count: {
            selector: '.pagination-component p.results-count strong:last-child',
            process: /[0-9]{0,5}/,
            singular: true
        },
        links: {
            attribute: 'href',
            selector: 'a.product-tile--title.product-tile--browsable'
        }
    };

    process(extracted, doc) {
        extracted.url = doc.url;
        return extracted
    };
}

export class save extends TaskScript {
    script() {
        return repo.removeJsonDocuments('tescoProductsLinks').then(()=> {
            return repo.getJsonDocuments({type: 'tescoLinks'}).then((d)=> {
                const linksSet = _.reduce(d.results, (acc, item)=> {
                    return acc.concat(_.get(item, 'body.links'));
                }, []);
                return repo.saveJsonDocument('tescoProductsLinks', {links: linksSet});
            });
        });
    }
}

export class downloadProducts extends TaskDownload {
    name = 'tescoProduct';
    autoRemove = true;

    urls() {
        return repo.getJsonDocuments({type: 'tescoProductsLinks'}).then((tescoProductsLinks)=> {
            const links = _.get(tescoProductsLinks, 'results[0].body.links', []);
            return _.map(links, identity => 'https://ezakupy.tesco.pl/' + identity);
        });
    }
}

export class extractProducts extends TaskExtract {
    sourceHttpDocuments = {
        name: 'tescoProduct'
    };
    targetJsonDocuments = {
        typeName: 'product',
    };
    map = {
        name: {
            singular: true,
            selector: 'h1.product-title'
        },
        imgAddress: {
            singular: true,
            selector: 'img.product-image',
            attribute: 'src'
        },
        description: {
            singular: true,
            selector: 'h4.itemHeader:contains("Opis produktu") ~ p'
        },
        ingredients: {
            singular: true,
            selector: '.brand-bank--brand-info .groupItem h3:contains("Składniki") ~ div.longTextItems>p'
        },
        ean: {
            singular: true,
            selector: 'img.product-image',
            attribute: 'src',
            process: /[0-9]{13}/
        }
    };

    process(extracted, doc) {
        extracted.components = [];
        extracted.sourceUrl = doc.url;
        extracted.queryCount = 0;
        return extracted;
    };
}
