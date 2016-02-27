'use strict';
/*jshint -W106*/

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
    cwk: '.dynamic-cols section:nth-child(2) table tr:nth-child(1) td:nth-child(2)',
    cwk_sector_relative: '.dynamic-cols section:nth-child(2) table tr:nth-child(1) td:nth-child(3) .pv',
    cp: '.dynamic-cols section:nth-child(2) table tr:nth-child(2) td:nth-child(2)',
    cp_sector_relative: '.dynamic-cols section:nth-child(2) table tr:nth-child(2) td:nth-child(3) .pv',
    cz: '.dynamic-cols section:nth-child(2) table tr:nth-child(3) td:nth-child(2)',
    cz_sector_relative: '.dynamic-cols section:nth-child(2) table tr:nth-child(3) td:nth-child(3) .pv',
    czo: '.dynamic-cols section:nth-child(2) table tr:nth-child(4) td:nth-child(2)',
    czo_sector_relative: '.dynamic-cols section:nth-child(2) table tr:nth-child(4) td:nth-child(3) .pv',
    roe: '.dynamic-cols section:nth-child(2) table tr:nth-child(5) td:nth-child(2)',
    roe_sector_relative: '.dynamic-cols section:nth-child(2) table tr:nth-child(5) td:nth-child(3) .pv',
    roa: '.dynamic-cols section:nth-child(2) table tr:nth-child(6) td:nth-child(2)',
    roa_sector_relative: '.dynamic-cols section:nth-child(2) table tr:nth-child(6) td:nth-child(3) .pv',
    valuation: '.ratings tr:nth-child(3) .pv:nth-child(1)'
};
