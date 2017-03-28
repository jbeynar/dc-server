import * as _ from 'lodash';
import * as Promise from 'bluebird';
import {createMapping} from '../../libs/exporterElasticsearch';
import {TaskExportElasticsearch} from "../../shared/typings";
import * as http from 'http-as-promised';
import * as chai from 'chai';
import * as Chance from 'chance';
import * as repo from "../../libs/repo";
import {config} from '../../config';

const expect = chai.expect;
const esExecutionDelay = 500;

const targetConfig = {
    url: 'http://localhost:9200',
    indexName: 'repo-test-index'
};

function generateData(n): any[] {
    const chance = new Chance();
    const data = [];
    for (let i = 0; i < n; i++) {
        data.push({
            name: chance.name(),
            address: chance.address(),
            country: chance.country(),
            description: chance.sentence()
        });
    }
    return data;
}

const mapping = {
    dynamic: 'strict',
    properties: {
        name: {
            type: 'string',
        },
        address: {
            type: 'string'
        },
        country: {
            type: 'string',
            index: 'not_analyzed'
        },
        description: {
            type: 'string',
        }
    }
};

class ExportTask extends TaskExportElasticsearch {
    sourceJsonDocuments = {
        typeName: targetConfig.indexName
    };

    target = {
        url: targetConfig.url,
        bulkSize: 50,
        indexName: targetConfig.indexName,
        mapping: {'repo-test-index': mapping}
    };
}

describe('elasticsearchExporter', () => {

    it('target ES instance is running', () => {
        return http.get(targetConfig.url).spread((result, body) => {
            body = JSON.parse(body);
            expect(body.cluster_name).to.be.equal('elasticsearch');
            return expect(result.statusCode).to.be.equal(200);
        });
    });

    describe('Stream repo JSON documents into ES index', () => {

        before(() => {
            return repo.removeJsonDocuments(targetConfig.indexName).then(() => {
                return Promise.map(generateData(100), (item) => {
                    return repo.saveJsonDocument(targetConfig.indexName, item);
                }, {concurrency: 10});
            });
        });

        it('invoke execute method that export data if index NOT exists', () => {
            const url = `${targetConfig.url}/${targetConfig.indexName}`;
            const esDeletePromise = http({uri: url, method: 'DELETE'}).catch((error) => {
                if (error.statusCode !== 404) {
                    throw new Error(error);
                }
            });

            return esDeletePromise.then(() => {
                const task = new ExportTask();
                return task.execute().delay(esExecutionDelay).then(() => {
                    const url = `${targetConfig.url}/${targetConfig.indexName}/_search?size=1`;
                    return http.get(url).spread((result, body) => {
                        body = JSON.parse(body);
                        expect(result.statusCode).to.be.equal(200);
                        expect(body.hits.total).to.be.equal(100);
                        expect(body.hits.hits[0]._source).to.have.property('name');
                        expect(body.hits.hits[0]._source).to.have.property('address');
                        expect(body.hits.hits[0]._source).to.have.property('country');
                        return expect(body.hits.hits[0]._source).to.have.property('description');
                    });
                });
            });
        });

        it('export data and if index IS exists it will overwrite', () => {
            const task = new ExportTask();
            return createMapping(targetConfig.url, targetConfig.indexName, task.target.mapping, true).then(() => {
                return task.execute().delay(esExecutionDelay).then(() => {
                    const url = `${targetConfig.url}/${targetConfig.indexName}/_search?size=1`;
                    return http.get(url).spread((result, body) => {
                        body = JSON.parse(body);
                        expect(result.statusCode).to.be.equal(200);
                        expect(body.hits.total).to.be.equal(100);
                        expect(body.hits.hits[0]._source).to.have.property('name');
                        expect(body.hits.hits[0]._source).to.have.property('address');
                        expect(body.hits.hits[0]._source).to.have.property('country');
                        return expect(body.hits.hits[0]._source).to.have.property('description');
                    });
                });
            });
        });
    });

    describe('Stream big number of documents into ES index', () => {

        before(() => {
            const concurrencyOpenConnections = Math.max(config.db.poolConfig.max - 10, 5);
            return repo.removeJsonDocuments(targetConfig.indexName).then(() => {
                return Promise.map(generateData(5000), (item) => {
                    return repo.saveJsonDocument(targetConfig.indexName, item);
                }, {concurrency: concurrencyOpenConnections});
            })
        });

        after(() => {
            const task = new ExportTask();
            const url = `${targetConfig.url}/${targetConfig.indexName}`;
            return Promise.all([repo.removeJsonDocuments(targetConfig.indexName), http({uri: url, method: 'DELETE'})]);
        });

        it('can handle 5000 documents (1000x5 bulks)', () => {
            const task = new ExportTask();
            task.target.bulkSize = 1000;
            return task.execute().delay(esExecutionDelay * 2).then(() => {
                const url = `${targetConfig.url}/${targetConfig.indexName}/_search?size=1`;
                return http.get(url).spread((result, body) => {
                    body = JSON.parse(body);
                    expect(result.statusCode).to.be.equal(200);
                    expect(body.hits.total).to.be.equal(5000);
                    expect(body.hits.hits[0]._source).to.have.property('name');
                    expect(body.hits.hits[0]._source).to.have.property('address');
                    expect(body.hits.hits[0]._source).to.have.property('country');
                    return expect(body.hits.hits[0]._source).to.have.property('description');
                });
            });
        });
    });
});
