'use strict';

module.exports = {
    settings: {},
    steps: [
        {
            id: '5667431a-a4b0-11e8-98d0-529269fb1459',
            operator: 'static-feed',
            body: [1, 2, 3]
        },
        {
            id: '56676bba-a4b0-11e8-98d0-529269fb1459',
            operator: 'map',
            body: x => `http://www.somewebsite.com/item-id=${x}`
        },
        {
            id: '56675eea-a4b0-11e8-98d0-529269fb1459',
            operator: 'download',
            options: {},
            save: {}
        },
        {
            id: '56678d8e-a4b0-11e8-98d0-529269fb1459',
            operator: 'extract',
            body: {
                map: {
                    name: {
                        selector: 'h1.product-title'
                    },
                    imgAddress: {
                        selector: 'img.product-image',
                        attribute: 'src'
                    },
                    description: {
                        selector: 'h4.itemHeader:contains("Opis produktu") ~ p'
                    },
                    ingredients: {
                        selector: '.brand-bank--brand-info .groupItem h3:contains("Składniki") ~ div.longTextItems>p'
                    },
                    code: {
                        selector: 'img.product-image',
                        attribute: 'src',
                        process: /[0-9]{13}/
                    },
                    producer: {
                        selector: '.brand-bank--brand-info .groupItem h3:contains("Nazwa i Adres Podmiotu Odpowiedzialnego") ~ div.memo>p'
                    },
                    price: {
                        selector: '.price-per-sellable-unit'
                    },
                    humanUnitPrice: {
                        selector: '.price-per-quantity-weight'
                    }
                }
            },
            onChange: () => {
            }
        }
    ]
};
