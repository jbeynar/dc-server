'use strict';

const rfr = require('rfr');
const fs = require('fs');
const _ = require('lodash');
const downloader = rfr('libs/downloader');

var products = JSON.parse(fs.readFileSync('slug-list.json').toString());

var urls = _.map(products.content, function (p)
{
    return 'http://www.alma24.pl/web/product-views/' + p.slug;
});

console.log(`Don't forget to provide valid cookie before run, otherwise every request returns 412.`);

var headers = ['Cookie: __lc.visitor_id.4837391	 S1474475159.1623840c6c; JSESSIONID=1xztbo0z7wdb11cgze9wq3cnda;',
               'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'];

downloader.downloadHttpDocuments(urls, headers);
