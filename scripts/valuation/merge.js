const rfr = require('rfr');
const DocumentDAO = rfr('libs/repo/DocumentDAO');

var type1Cfg = {
    type: 'valuation.biznesradar',
    id: 'symbol'
};
var type2Cfg = {
    type: 'valuation.stockwatch',
    id: 'symbol'
};
return DocumentDAO.mergeDocuments(type1Cfg, type2Cfg, 'valuation');
