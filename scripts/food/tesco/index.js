'use strict';

const rfr = require('rfr');
const _ = require('lodash');
const extraction = rfr('libs/extraction');
const downloader = rfr('libs/downloader');


// todo instead download.fetchHttpDocuments use fs.readFile
downloader.fetchHttpDocuments(['https://ezakupy.tesco.pl/groceries/']).then(function (sites)
{
    var map = {
        categories: {
            selector: 'html',
            attribute: 'data-props',
            process: function (dataProps)
            {
                return JSON.parse(dataProps);
            }
        }
    };
    return extraction.extractArray(sites[0].body, map).catch(function (err)
    {
        console.log('Extraction failure');
        console.error(err);
    });
}).then(function (extraction)
{
    return _.chain(extraction.categories).head().get('nav').map('items').map(function (items)
    {
        var ids = [];
        _.forEach(items, function (item)
        {
            _.forEach(item.items, function (i)
            {
                ids.push(i.catId);
            });
        });
        return ids;
    }).reduce(function (acc, categoriesVector)
    {
        return acc.concat(categoriesVector);
    }, []).value();
}).then(function (catIds)
{
    var urls = _.map(catIds, function (CatId)
    {
        return 'https://ezakupy.tesco.pl/groceries/pl-PL/categories/' + CatId;
    });

    return downloader.downloadHttpDocuments(urls);
});
