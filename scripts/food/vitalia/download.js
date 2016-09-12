'use strict';

const _ = require('lodash');
const rfr = require('rfr');
const downloader = rfr('libs/downloader');
// const DocumentDAO = rfr('libs/DocumentDAO');

var baseUrl = 'http://vitalia.pl/index.php/mid/90/fid/1047/kalorie/diety/product_id';

var urls = _.times(818, function (i)
{
    return [baseUrl, '/', i, '/'].join('');
});

var headers = ['User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'];
downloader.downloadHttpDocuments(urls, headers);
