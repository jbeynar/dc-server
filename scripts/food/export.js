'use strict';

const rfr = require('rfr');
const exporter = rfr('libs/exporter');
const config = rfr('config');

var exportConfig = {
    sourcePostgresqlUrl: config.db.connectionUrl,
    sourceTypeName: 'product',
    targetMongoDbUrl: 'mongodb://localhost:27017/food-scanner',
    targetCollectionName: 'products'
};

return exporter.dropMongoCollections(exportConfig.targetMongoDbUrl, [exportConfig.targetCollectionName]).then(()=> {
    return exporter.exportIntoMongo(exportConfig);
});
