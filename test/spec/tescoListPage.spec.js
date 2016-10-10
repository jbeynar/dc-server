'use strict';

const expect = require('chai').expect;
const rfr = require('rfr');
const utils = rfr('test/utils');
const extractor = rfr('libs/extractor');
const _ = require('lodash');

describe('Extract data from static page', ()=>
{
    var pageSource;

    before(() =>
    {
        return utils.getFixture('tescoList.html').then((document)=>
        {
            pageSource = document;
        });
    });

    it('Extracts data structure from specific product page', ()=>
    {
        var map = {
            links: {
                attribute: 'href',
                selector: 'a.product-tile--title.product-tile--browsable'
            }
        };

        // var expected = {};

        return extractor.extract(pageSource, map).then((data)=>
        {
            return expect(data).to.be.an('object');
        });

    });


    it('Extracts categories from page', ()=>
    {

        var map = {
            selector: 'html',
            attribute: 'data-props',
            process: 'Cat[0-9]+'
        };

        var expected = {};

        return extractor.extract(pageSource, map).then((data)=>
        {
            return expect(data).to.be.an('object');
        });
    });

});


