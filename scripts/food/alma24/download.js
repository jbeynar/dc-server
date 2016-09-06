'use strict';

const rfr = require('rfr');
const fs = require('fs');
const _ = require('lodash');
const downloader = rfr('libs/downloader');

var products = JSON.parse(fs.readFileSync('product-view.json').toString());

var urls = _.map(products.content, function (p)
{
    return 'http://www.alma24.pl/web/product-views/' + p.slug;
});

var headers = ['Cookie: __lc.visitor_id.4837391	S1473016532.362be95dad; JSESSIONID=doepdh6132r5127u90l6m60sw;',
               'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'];

downloader.downloadHttpDocuments(urls, headers);
