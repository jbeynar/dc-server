'use strict';

import chai = require('chai');
import rfr = require('rfr');
import _ = require('lodash');

const utils = rfr('test/utils');
const extractor = rfr('libs/extractor');
const expect = chai.expect;

describe('Tesco list page case study', ()=>
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

        return extractor.extract({ body: pageSource }, map).then((data)=>
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

        return extractor.extract({ body: pageSource }, map).then((data)=>
        {
            return expect(data).to.be.an('object');
        });
    });

});


