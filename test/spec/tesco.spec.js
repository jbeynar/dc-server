'use strict';

const expect = require('chai').expect;
const rfr = require('rfr');
const utils = rfr('test/utils');
const extraction = rfr('libs/extraction');
const _ = require('lodash');

function getByHeader(element, header)
{
    return _.chain(element).map((item) =>
    {
        var headerData = _.first(_.get(item, 'children[0].children')) || {};
        var body = _.first(_.get(item, 'children[1].children')) || {};

        return {
            header: headerData.data,
            body: body.data
        };
    }).filter((item)=>
    {
        return _.trim(item.header, '\n') === header;
    }).first().get('body').value();
}

/*
Keep it in case of hq/contains-based selector fucked up

selector: '.brand-bank--brand-info .groupItem',
function getIngredients(element)
{
    var ingredientsItem = _.filter(element, (item) =>
    {
        return 'Składniki' === _.get(_.first(_.get(item, 'children[0].children')), 'data');
    });
    var body = _.get(_.first(ingredientsItem), 'children[1].children[0]');
    var text = [];
    _.forEach(body.children, function (child)
    {
        if (_.has(child, 'children')) {
            text.push(_.first(child.children).data);
        } else {
            text.push(child.data);
        }
    });
    return text.join('');
}
*/

describe('Extract data from static page', ()=>
{
    var pageSource;

    before(() =>
    {
        return utils.getFixture('tesco.html').then((document)=>
        {
            pageSource = document;
        });
    });

    it('Extracts data structure from specific product page', ()=>
    {
        var map = {
            name: {
                selector: 'h1.product-title'
            },
            imgAddress: {
                selector: 'img.product-image',
                attribute: 'src'
            },
            description: {
                selector: '.groupItem .memo',
                process: function (item, element)
                {
                    return getByHeader(element, 'Opis produktu');
                }
            },
            ingredients: {
                selector: '.brand-bank--brand-info .groupItem h3:contains("Składniki") ~ div.longTextItems>p',
            }
        };

        var expected = {
            name: 'Winiary Majonez lekki 250 ml',
            imgAddress: 'https://secure.ce-tescoassets.com/assets/PL/502/5900862212502/ShotType1_328x328.jpg',
            description: 'Majonez lekki o obniżonej zawartości tłuszczu - przyjemność z jedzenia dla osób dbających o linię. Idealnie smakuje jako dodatek do sałatek, kanapek, jajek, wędlin na zimno.',
            ingredients: 'woda, olej rzepakowy, glukoza, musztarda (woda, gorczyca, ocet, sól, cukier, przyprawy, aromat), żółtko jaja, substancje zagęszczające (skrobia modyfikowana, guma guar), ocet, sól, regulatory kwasowości (E 338, kwas mlekowy, kwas cytrynowy), cukier, substancja konserwująca (E 202), przyprawy, przeciwutleniacz (E 385), aromat'
        };

        return extraction.extract(pageSource, map).then((data)=>
        {
            console.log(data);
            expect(data.imgAddress).to.eql(expected.imgAddress);
            expect(data.description).to.eql(expected.description);
            expect(data.ingredients).to.eql(expected.ingredients);
            return expect(data.name).to.eql(expected.name);
        });

    });
});


