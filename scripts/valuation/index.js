const rfr = require('rfr');
const repo = rfr('libs/repo');

var type1Cfg = {
    type: 'valuation.biznesradar',
    id: 'symbol'
};
var type2Cfg = {
    type: 'valuation.stockwatch',
    id: 'symbol'
};
return repo.mergeDocuments(type1Cfg, type2Cfg, 'valuation');
