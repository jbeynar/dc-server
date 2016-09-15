'use strict';

const rfr = require('rfr');
const squel = require('squel').useFlavour('postgres');
const promise = require('bluebird');
const extraction = rfr('libs/extraction');
const db = rfr('libs/db');
const DocumentDAO = rfr('libs/repo/DocumentDAO');
const _ = require('lodash');

const harmityMap = {
    'Bezpieczny': 0,
    'Należy unikać': 1,
    'Zalecana ostrożność': 1,
    'Niekorzystny': 2,
    'Wycofany z użycia': 3,
    'Niebezpieczny': 3,
    'Niebezpieczny, Wycofany z użycia': 3
};

var map = {
    primaryNames: {
        selector: '.widecolumn>h1',
        process: function (text)
        {
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
        selector: '.widecolumn>h2',
        process: function (text)
        {
            text = text.replace(/Inne nazwy: /, '');
            var matches = text.match(/([^,()])+/g);
            return _.map(matches, (match) =>
            {
                return match.trim();
            });
        }
    },
    category: {
        selector: 'table.sortabless tr:nth-child(2) td:nth-child(1)'
    },
    purpose: {
        selector: 'table.sortabless tr:nth-child(2) td:nth-child(2)'
    },
    rating: {
        selector: 'table.sortabless tr:nth-child(2) td:nth-child(3)',
        process: function (text)
        {
            return harmityMap[text];
        }
    }
};

function importDocuments()
{
    return db.connect().then(function (client)
    {
        let query = squel.select().from('repo.document_http').where('host LIKE ?', 'vitalia.pl').toParam();
        return client.query(query.text, query.values).then((results)=>
        {
            return results.rows;
        }).then((documents)=>
        {
            console.log('Processing documents...');
            var componentsE = [], componentsNonE = [];
            return promise.each(documents, (doc)=>
            {
                return extraction.extract(doc.body, map).then(function (extracted)
                {
                    if (!extracted.primaryNames.name) {
                        console.log('Excluded', doc.url);
                        return;
                    }
                    extracted.name = extracted.primaryNames.name;
                    extracted.code = extracted.primaryNames.code;
                    extracted.names = [extracted.name, extracted.code];
                    if (extracted.secondaryNames) {
                        extracted.names = extracted.names.concat(extracted.secondaryNames);
                    }
                    delete extracted.primaryNames;
                    delete extracted.secondaryNames;

                    if ('E' === extracted.code[0]) {
                        componentsE.push(extracted);
                    }
                });
            }).then(function ()
            {
                var sorted = _.sortBy(componentsE, 'code');
                console.log('Saving', sorted.length, 'documents');
                return promise.map(sorted, function (component)
                {
                    return DocumentDAO.saveJsonDocument('vitalia', component);
                }, {concurrency: 1});
            });
        }).finally(client.done);
    }).catch(db.exceptionHandler);
}

importDocuments();
