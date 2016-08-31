const rfr = require('rfr');
const DocumentDAO = rfr('libs/repo/DocumentDAO');
const _ = require('lodash');
var mongo = require('mongodb').MongoClient;
var mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/stocks';
const promise = require('bluebird');

function exportIntoMongo(connectionUrl, type) {
    return DocumentDAO.getJsonDocuments({type: type}).then(function (res) {
        return res.results
    }).then(function (stocks) {
        return new promise(function (resolve, reject) {
            mongo.connect(connectionUrl, function (err, client) {
                var stocksCollection = client.collection('stock');
                stocksCollection.insertMany(stocks, function () {
                    console.log(arguments);
                    resolve();
                });
                console.log('Inserted');
            });
        });
    });
};

return exportIntoMongo(mongodbUrl, 'valuation');
