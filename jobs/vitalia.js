'use strict';

const _ = require('lodash');

const baseUrl = 'http://vitalia.pl/index.php/mid/90/fid/1047/kalorie/diety/product_id';

const harmityMap = {
    'Bezpieczny': 0,
    'Należy unikać': 1,
    'Zalecana ostrożność': 1,
    'Niekorzystny': 2,
    'Wycofany z użycia': 3,
    'Niebezpieczny': 3,
    'Niebezpieczny, Wycofany z użycia': 3
};

module.exports = {
    download: {
        type: 'download',
        urls: ()=> {return _.times(818, i => [baseUrl, '/', i].join('')); },
        options: {
            headers: ['User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'],
            intervalTime: 500
        }
    },
    extract: {
        type: 'extract',
        sourceHttpDocuments: {
            host: 'vitalia.pl'
        },
        targetJsonDocuments: {
            typeName: 'ingredient',
            autoRemove: true
        },
        map: {
            primaryNames: {
                singular: true,
                selector: '.widecolumn>h1',
                process: function (text) {
                    text = text.replace('Informacje o dodatku: ', '');
                    var matches = text.match(/([^ ].*[^ ]) *\( ?([^ ].*[^ ]) ?\)/);
                    var names = {};
                    if (matches) {
                        names.name = matches[1];
                        names.code = matches[2];
                    }
                    return names;
                }
            },
            secondaryNames: {
                singular: true,
                selector: '.widecolumn>h2',
                process: function (text) {
                    text = text.replace(/Inne nazwy: /, '');
                    var matches = text.match(/([^,()])+/g);
                    return _.map(matches, (match) => {
                        return match.trim();
                    });
                }
            },
            category: {
                singular: true,
                selector: 'table.sortabless tr:nth-child(2) td:nth-child(1)'
            },
            purpose: {
                singular: true,
                selector: 'table.sortabless tr:nth-child(2) td:nth-child(2)'
            },
            rating: {
                singular: true,
                selector: 'table.sortabless tr:nth-child(2) td:nth-child(3)',
                process: function (text) {
                    return harmityMap[text];
                }
            }
        },
        process: (extracted, doc)=> {
            if (!_.get(extracted, 'primaryNames.name')) {
                console.log(`Excluded cause have no name ${doc.url}`);
                return;
            }
            if ('E' !== _.get(extracted, 'primaryNames.code[0]')) {
                console.log(`Excluded cause invalid code ${doc.url}`);
                return;
            }
            extracted.url = doc.url;
            extracted.name = extracted.primaryNames.name;
            extracted.code = extracted.primaryNames.code;
            extracted.names = [extracted.name, extracted.code];
            if (extracted.secondaryNames) {
                extracted.names = extracted.names.concat(extracted.secondaryNames);
            }
            delete extracted.primaryNames;
            delete extracted.secondaryNames;
            return extracted;
        }
    }
};
