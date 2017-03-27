import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as exporterElasticsearch from '../../libs/exporterElasticsearch';
import {TaskExportElasticsearch} from "../../shared/typings";
import * as http from 'http-as-promised';
import * as chai from 'chai';
import * as Chance from 'chance';
import * as repo from "../../libs/repo";

const expect = chai.expect;
const esExecutionDelay = 1000;
const targetConfig = {
    url: 'http://localhost:9200',
    indexName: 'repo-test-index'
};

describe('elasticsearchExporter exports documents from repo into ES instance', () => {

    it('target ES instance is running', () => {
        return http.get(targetConfig.url).spread((result, body) => {
            body = JSON.parse(body);
            expect(body.cluster_name).to.be.equal('elasticsearch');
            return expect(result.statusCode).to.be.equal(200);
        });
    });

    describe('Stream repo JSON documents into ES index', () => {

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
                bulkSize: 100,
                indexName: targetConfig.indexName,
                mapping: {'repo-test-index': mapping}
            };
        }

        before('seed repo with JSON documents and remove ES index', () => {
            const chance = new Chance();
            const n = 1000, data = [];
            for (let i = 0; i < n; i++) {
                data.push({
                    name: chance.name(),
                    address: chance.address(),
                    country: chance.country(),
                    description: chance.sentence()
                });
            }

            const url = `${targetConfig.url}/${targetConfig.indexName}`;
            const esDeletePromise = http({uri: url, method: 'DELETE'}).catch((error) => {
                if (error.statusCode !== 404) {
                    throw new Error(error);
                }
            });

            const dataSeedPromise = repo.removeJsonDocuments(targetConfig.indexName).then(() => {
                return Promise.map(data, (item) => {
                    return repo.saveJsonDocument(targetConfig.indexName, item);
                }, {concurrency: 5});
            });

            return Promise.all([esDeletePromise, dataSeedPromise]);
        });

        it('invoke execute method that export data in bulks', () => {
            const task = new ExportTask();
            return task.execute().delay(esExecutionDelay).then(() => {
                const url = `${targetConfig.url}/${targetConfig.indexName}/_search?size=1`;
                return http.get(url).spread((result, body) => {
                    body = JSON.parse(body);
                    expect(result.statusCode).to.be.equal(200);
                    expect(body.hits.total).to.be.equal(1000);
                    expect(body.hits.hits[0]._source).to.have.property('name');
                    expect(body.hits.hits[0]._source).to.have.property('address');
                    expect(body.hits.hits[0]._source).to.have.property('country');
                    return expect(body.hits.hits[0]._source).to.have.property('description');
                });
            });
        });
    });
});
