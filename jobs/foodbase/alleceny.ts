'use strict';

import _ = require('lodash');
import Promise = require('bluebird');
import db = require('../../libs/db');
import {TaskDownload, TaskExtract} from "../../shared/typings";

export class download extends TaskDownload {
    name = 'foodbase-alleceny';

    urls() {
        return _.times(50000, i => `http://www.alleceny.pl/produkt/${i}/soplica_szlachetna_wodka_1_l`);
    };

    options: {
        headers: ['Accept-Encoding: gzip, deflate, sdch',
            'Accept-Language: pl',
            'Upgrade-Insecure-Requests: 1',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Cache-Control: max-age=0',
            'Cookie: PHPSESSID=einuuooas1toddvg843agd3rp4; modal-info=true; grey_wizard=epOHw%2F98%2Bg%2FVY4Mflp4XtduWWQcfTzQtIyZRvhdFoOi4mXhHTYk3qIqMgqpT9vT4%2B7cAReSL01LkkWxEqfoMYw%3D%3D; _gat=1; _ga=GA1.2.632424612.1486160804',
            'Connection: keep-alive'],
        intervalTime: 500
    }
}

const failUrls = [
    {
        "url": "http://www.alleceny.pl/produkt/1958/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1959/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1960/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1961/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1962/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1963/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1964/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1965/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1966/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/1967/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/6235/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/9075/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/10767/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/11277/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/11286/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/14126/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/14805/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/14806/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/14807/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/14808/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/14998/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/15518/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/15937/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/15946/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16082/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16848/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16849/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16865/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16867/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16869/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16870/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16871/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16885/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/16890/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/17242/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/19892/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/23015/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/25178/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/30429/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/30432/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/30493/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/35704/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/35705/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/35706/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/35707/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/35708/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/35950/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/35951/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/35952/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/36157/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/36158/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/36944/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/36945/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/36946/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/37130/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/37131/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/37132/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/37133/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/37134/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/37135/soplica_szlachetna_wodka_1_l",
        "code": 503
    },
    {
        "url": "http://www.alleceny.pl/produkt/37137/soplica_szlachetna_wodka_1_l",
        "code": 502
    },
    {
        "url": "http://www.alleceny.pl/produkt/37138/soplica_szlachetna_wodka_1_l",
        "code": 502
    },
    {
        "url": "http://www.alleceny.pl/produkt/37602/soplica_szlachetna_wodka_1_l",
        "code": 503
    },
    {
        "url": "http://www.alleceny.pl/produkt/37603/soplica_szlachetna_wodka_1_l",
        "code": 502
    },
    {
        "url": "http://www.alleceny.pl/produkt/37604/soplica_szlachetna_wodka_1_l",
        "code": 502
    },
    {
        "url": "http://www.alleceny.pl/produkt/37690/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/38570/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/38571/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/38572/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/38578/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/39890/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41049/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41050/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41051/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41052/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41059/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41060/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41085/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41086/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41087/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41088/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41089/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41090/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41094/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41095/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41096/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41276/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41309/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41337/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/41338/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/44660/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/44661/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/44979/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/44980/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/44981/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/44982/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46380/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46381/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46382/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46383/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46384/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46385/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46386/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46387/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46388/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46389/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46390/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46391/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46392/soplica_szlachetna_wodka_1_l",
        "error": {}
    },
    {
        "url": "http://www.alleceny.pl/produkt/46393/soplica_szlachetna_wodka_1_l",
        "error": {}
    }
];

export class extract extends TaskExtract {
    sourceHttpDocuments = {
        name: 'foodbase-alleceny'
    };
    targetJsonDocuments = {
        typeName: 'foodbase-alleceny',
        autoRemove: true
    };
    map = {
        name: {
            singulat: true,
            selector: 'h1.productname'
        },
        ingredients: {
            singular: false,
            selector: 'h2:contains("Składniki") ~ ul>li'
        },
        features: {
            singular: false,
            selector: 'h3:contains("Cechy") ~ ul>li'
        },
        nutrition: {
            singular: false,
            selector: 'h3:contains("Wartości odżywcze") ~ table>tbody>tr>*'
        },
        brand: {
            singular: true,
            selector: '.productInfoComponent .buttons-group ~ p>a:first-child'
        },
        group: {
            singular: true,
            selector: '.productInfoComponent .buttons-group ~ p>a:last-child'
        },
        priceLow: {
            singular: true,
            selector: '.priceBox>div:first-child p'
        },
        priceHigh: {
            singular: true,
            selector: '.priceBox>div:nth-child(2) p:first-child strong'
        },
        image: {
            singular: true,
            selector: '.zoom .fancybox',
            attribute: 'href'
        }
    };
}
