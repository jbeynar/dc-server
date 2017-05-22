import * as _ from 'lodash';
import {TaskDownload, TaskExportElasticsearch, TaskExtract} from "../shared/typings";

export class download extends TaskDownload {

    name = 'espn-team';
    autoRemove = true;

    urls() {
        return ['http://www.espn.co.uk/football/team/_/id/359/Arsenal/', 'http://www.espn.co.uk/football/team/_/id/359/Manchester/', 'http://www.espn.co.uk/football/team/_/id/359/FC Barcelona/'];
    }
}

export class extract extends TaskExtract {

    sourceHttpDocuments = {
        name: 'espn-team'
    };

    targetJsonDocuments = {
        typeName: 'espn-team-prem',
        autoRemove: true
    };

    scope = '#main-container > div > section.col-c.chk-height > article.sub-module.standings > div > table > tbody > tr';

    map = {
        team: {selector: 'td:nth-child(1)', singular: true},
        gp: {selector: 'td:nth-child(2)', singular: true},
        w: {selector: 'td:nth-child(3)', singular: true},
        d: {selector: 'td:nth-child(4)', singular: true},
        l: {selector: 'td:nth-child(5)', singular: true},
        gd: {selector: 'td:nth-child(6)', singular: true},
        p: {selector: 'td:nth-child(7)', singular: true}
    };

    process(extractedDocuments) {
        return _.map(extractedDocuments, (item: any) => {
            item.team = 'My team: ' + item.team;
            return item;
        });
    };
}

export class exportEs extends TaskExportElasticsearch {

    sourceJsonDocuments = {
        typeName: 'espn-team-prem'
    };

    target = {
        url: 'http://localhost:9200',
        indexName: 'football',
        bulkSize: 2,
        mapping: {
            football: {
                dynamic: 'strict',
                properties: {
                    team: {
                        type: 'string'
                    },
                    gp: {
                        type: 'integer',
                        index: 'not_analyzed'
                    },
                    w: {
                        type: 'integer',
                        index: 'not_analyzed'
                    },
                    d: {
                        type: 'integer',
                        index: 'not_analyzed'
                    },
                    l: {
                        type: 'integer',
                        index: 'not_analyzed'
                    },
                    gd: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    p: {
                        type: 'integer',
                        index: 'not_analyzed'
                    }
                }
            }
        },
        overwrite: true
    };

}
