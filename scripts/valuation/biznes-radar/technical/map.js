'use strict';
/*jshint -W106*/
/*jshint -W101*/

module.exports = {
    symbol: {
        selector: '#profile-header > div.profile-h1-c > h1',
        process: ''
    },
    rsi: '#profile-indicators > div.dynamic-content-container > div.results-table-container.indicators > table > tbody > tr:nth-child(2) > td:nth-child(2)',
    sma_15: '#profile-indicators > div.dynamic-content-container > div.results-table-container.averages > table > tbody > tr:nth-child(2) > td:nth-child(3) > span.value',
    sma_30: '#profile-indicators > div.dynamic-content-container > div.results-table-container.averages > table > tbody > tr:nth-child(2) > td:nth-child(4) > span.value',
    ema_15: '#profile-indicators > div.dynamic-content-container > div.results-table-container.averages > table > tbody > tr:nth-child(3) > td:nth-child(3) > span.value',
    ema_30: '#profile-indicators > div.dynamic-content-container > div.results-table-container.averages > table > tbody > tr:nth-child(3) > td:nth-child(4) > span.value'
};
