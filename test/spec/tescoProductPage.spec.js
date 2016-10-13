'use strict';

const expect = require('chai').expect;
const rfr = require('rfr');
const utils = rfr('test/utils');
const extractor = rfr('libs/extractor');
const _ = require('lodash');

describe('Tesco product page case study', ()=>
{
    var pageSource;

    before(() =>
    {
        return utils.getFixture('tescoProduct.html').then((document)=>
        {
            pageSource = document;
        });
    });

    it('Extracts data structure from specific product page', ()=>
    {
        var mapping = {
            map: {
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
                }
            }
        };

        var expected = {
            name: 'Winiary Majonez lekki 250 ml',
            imgAddress: 'https://secure.ce-tescoassets.com/assets/PL/502/5900862212502/ShotType1_328x328.jpg',
            description: 'Majonez lekki o obniżonej zawartości tłuszczu - przyjemność z jedzenia dla osób dbających o linię. Idealnie smakuje jako dodatek do sałatek, kanapek, jajek, wędlin na zimno.',
            ingredients: 'woda, olej rzepakowy, glukoza, musztarda (woda, gorczyca, ocet, sól, cukier, przyprawy, aromat), żółtko jaja, substancje zagęszczające (skrobia modyfikowana, guma guar), ocet, sól, regulatory kwasowości (E 338, kwas mlekowy, kwas cytrynowy), cukier, substancja konserwująca (E 202), przyprawy, przeciwutleniacz (E 385), aromat'
        };

        return extractor.extract({body:pageSource}, mapping).then((data)=>
        {
            expect(data.imgAddress).to.eql(expected.imgAddress);
            expect(data.description).to.eql(expected.description);
            expect(data.ingredients).to.eql(expected.ingredients);
            return expect(data.name).to.eql(expected.name);
        });

    });
});


