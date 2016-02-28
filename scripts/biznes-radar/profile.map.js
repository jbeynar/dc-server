'use strict';
/*jshint -W106*/

const _ = require('lodash');

function filterNumeric(number)
{
    number = _.toString(number);
    return _.toNumber(number.match(/-?\d+.?\d+/));
}

module.exports = {
    website: '#left-content table.profileSummary.hidden tr:last-child td>a',
    description: '#left-content .profileDesc .hidden',
    symbol: {
        selector: 'h1',
        process: function (h1)
        {
            return h1.match(/Notowania ([\w]{3,4})/)[1];
        }
    },
    symbol_long: {
        selector: 'h1',
        process: function (h1)
        {
            let symbol = h1.match(/Notowania ([\w]{3,4})/)[1];
            let symbolLong = h1.match(/\((.*)\)/);
            return symbolLong && 2 === symbolLong.length ? symbolLong[1] : symbol;
        }
    },
    name: 'h2',
    sector: '.box-left[itemtype] table.profileSummary tr:nth-child(5) td a[title]',
    cwk: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(1) td:nth-child(2)',
        process: filterNumeric
    },
    cwk_rel: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(1) td:nth-child(3) .pv',
        process: filterNumeric
    },
    cp: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(2) td:nth-child(2)',
        process: filterNumeric
    },
    cp_rel: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(2) td:nth-child(3) .pv',
        process: filterNumeric
    },
    cz: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(3) td:nth-child(2)',
        process: filterNumeric
    },
    cz_rel: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(3) td:nth-child(3) .pv',
        process: filterNumeric
    },
    czo: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(4) td:nth-child(2)',
        process: filterNumeric
    },
    czo_rel: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(4) td:nth-child(3) .pv',
        process: filterNumeric
    },
    roe: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(5) td:nth-child(2)',
        process: filterNumeric
    },
    roe_rel: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(5) td:nth-child(3) .pv',
        process: filterNumeric
    },
    roa: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(6) td:nth-child(2)',
        process: filterNumeric
    },
    roa_rel: {
        selector: '.dynamic-cols section:nth-child(2) table tr:nth-child(6) td:nth-child(3) .pv',
        process: filterNumeric
    },
    value: {
        selector: '.ratings tr:nth-child(3) .pv:nth-child(1)',
        process: filterNumeric
    }
};
