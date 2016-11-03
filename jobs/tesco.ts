'use strict';

import {ITaskDownload} from "../libs/downloader";
import {ITaskExtract} from "../libs/extractor";
import {ITaskScript} from "../libs/launcher";

import _ = require('lodash');
import repo = require("../libs/repo");

const baseUrl = 'https://ezakupy.tesco.pl/groceries/pl-PL/shop/warzywa-owoce/warzywa/Cat0000';

const tescoLinksSourcesUrls = {
    favorites: ['https://ezakupy.tesco.pl/groceries/pl-PL/search?query=bounty',
        'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=hit',
        'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=pudliszki',
        'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=pudliszki&page=2',
        'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=kabanosy',
        'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=kabanosy&page=2',
        'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=kabanosy&page=3',
        'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=kabanosy&page=4'],
    range: ()=> {
        return _.map(_.range(5309, 5764, 1), k=>baseUrl + k);
    }
};

export const download: ITaskDownload = {
    type: 'download',
    name: 'tescoLinks',
    urls: tescoLinksSourcesUrls.favorites
};

export const extract: ITaskExtract = {
    type: 'extract',
    sourceHttpDocuments: {
        name: 'tescoLinks'
    },
    targetJsonDocuments: {
        typeName: 'tescoLinks',
        autoRemove: true
    },
    map: {
        count: {
            selector: '.pagination-component p.results-count strong:last-child',
            process: /[0-9]{0,5}/,
            singular: true
        },
        links: {
            attribute: 'href',
            selector: 'a.product-tile--title.product-tile--browsable'
        }
    },
    process: (extracted, doc)=> {
        extracted.url = doc.url;
        return extracted
    }
};

export const save: ITaskScript = {
    type: 'script',
    script: (data)=> {
        return repo.removeJsonDocuments('tescoProductsLinks').then(()=> {
            return repo.getJsonDocuments({type: 'tescoLinks'}).then((d)=> {
                var linksSet = _.reduce(d.results, (acc, item)=> {
                    return acc.concat(_.get(item, 'body.links'));
                }, []);
                return repo.saveJsonDocument('tescoProductsLinks', {links: linksSet});
            });
        });
    }
};

export const downloadProducts: ITaskDownload = {
    type: 'download',
    name: 'tescoProduct',
    urls: ()=> {
        return repo.getJsonDocuments({type: 'tescoProductsLinks'}).then((tescoProductsLinks)=> {
            var links = [].concat(_.get(tescoProductsLinks, 'results[0].body.links'));
            return _.map(links, identity => 'https://ezakupy.tesco.pl/' + identity);
        });
    }
};

export const extractProducts: ITaskExtract = {
    type: 'extract',
    sourceHttpDocuments: {
        name: 'tescoProduct'
    },
    targetJsonDocuments: {
        typeName: 'product',
        autoRemove: true
    },
    map: {
        name: {
            singular: true,
            selector: 'h1.product-title',
            default: 'Brak nazwy'
        },
        imgAddress: {
            singular: true,
            selector: 'img.product-image',
            attribute: 'src',
            default: 'Brak danych'
        },
        description: {
            singular: true,
            selector: 'h4.itemHeader:contains("Opis produktu") ~ p',
            default: 'Brak opisu'
        },
        ingredients: {
            singular: true,
            selector: '.brand-bank--brand-info .groupItem h3:contains("Składniki") ~ div.longTextItems>p',
            default: 'Brak danych'
        },
        ean: {
            singular: true,
            selector: 'img.product-image',
            attribute: 'src',
            process: /[0-9]{13}/,
            default: 'Brak kodu EAN'
        }
    },
    process: (extracted, doc)=> {
        extracted.url = doc.url;
        return extracted
    }
};
