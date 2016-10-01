'use strict';

const rfr = require('rfr');
const exporter = rfr('libs/exporter');

var exportConfig = {
    sourcePostgresqlUrl: config.db.connectionUrl,
    sourceTypeName: 'product',
    targetMongoDbUrl: 'mongodb://localhost:27017/food-scanner',
    targetCollectionName: 'products'
};

exporter.dropMongoCollections([exportConfig.targetCollectionName]).then(()=> {
    exporter.exportIntoMongo(exportConfig)
});
