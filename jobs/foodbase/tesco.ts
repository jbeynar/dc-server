'use strict';

import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as repo from '../../libs/repo';
import {TaskDownload, TaskExtract, TaskScript, TaskExport, IJsonSearchConfig} from "../../shared/typings";
import {getJsonDocuments} from "../../libs/repo";
import {isCodeExists} from "./shared";

const baseUrl = 'https://ezakupy.tesco.pl/groceries/pl-PL/shop/art.-spozywcze/all?page=';

let existsProductsCodes;

const tescoLinksSourcesUrls = {
    favorites: _.map(['bounty', 'hit', 'pudliszki', 'pudliszki&page=2',
            'kabanosy', 'kabanosy&page=2', 'winiary', 'winiary&page=2', 'winiary&page=3', 'winiary&page=4',
            'winiary&page=5', 'winiary&page=6', 'lisner', 'lisner&page=2', 'lisner&page=3',
            'lisner&page=4', 'kinder', 'roleski', 'wawel', 'wawel&page=2', 'wawel&page=3',
            'mlekovita', 'mlekovita&page=2', 'mlekovita&page=3', 'łosoś',
            'łosoś&page=2', 'piątnica', 'piątnica&page=2', 'masło',
            'kabanosy&page=3', 'kabanosy&page=4'],
        item => 'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=' + item),
    range: () => {
        return _.map(_.range(1, 243, 1), k => baseUrl + k);
    }
};

export class download extends TaskDownload {
    name = 'foodbase-tescoLinks';
    autoRemove = true;

    urls() {
        return tescoLinksSourcesUrls.range();
    }
}

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-tescoLinks'
    };
    targetJsonDocuments = {
        typeName: 'foodbase-tescoLinks',
        autoRemove: true
    };
    map = {
        links: {
            attribute: 'href',
            selector: 'a.product-tile--title.product-tile--browsable'
        }
    };

    process(extracted, doc) {
        return _.map(extracted.links, (identity: string) => {
            return {slug: identity, code: _.last(identity.match(/\/([0-9]{8,13})/))}
        });
    };
}

export class downloadProducts extends TaskDownload {
    name = 'foodbase-tescoProduct';
    autoRemove = true;
    urls() {
        return repo.getJsonDocuments({type: 'foodbase-tescoLinks'}).then((data) => {
            const results = [];
            return Promise.each(data.results, (item) => {
                return isCodeExists(item.body.code).then((ans) => {
                    if (ans) {
                        console.log(`Code ${item.body.code} already exists`);
                    } else {
                        results.push('https://ezakupy.tesco.pl/' + item.body.slug);
                    }
                });
            }).then(() => results);
        });
    }
}

export class extractProducts extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-tescoProduct'
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
        code: {
            singular: true,
            selector: 'img.product-image',
            attribute: 'src',
            process: /[0-9]{13}/
        },
        producer: {
            singular: true,
            selector: '.brand-bank--brand-info .groupItem h3:contains("Nazwa i Adres Podmiotu Odpowiedzialnego") ~ div.memo>p'
        },
        price: {
            singular: true,
            selector: '.price-per-sellable-unit'
        },
        humanUnitPrice: {
            singular: true,
            selector: '.price-per-quantity-weight'
        }
    };

    process(extracted, doc) {
        return isCodeExists(extracted.code).then((ans) => {
            if (ans) {
                console.log(`Code ${extracted.code} already exists`);
            } else {
                extracted.components = [];
                extracted.sourceUrl = doc.url;
                extracted.queryCount = 0;
                extracted.source = 'tesco';
                return extracted;
            }
        });
    };
}
