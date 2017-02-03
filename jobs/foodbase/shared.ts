import {getJsonDocuments} from "../../libs/repo";
import {IJsonSearchConfig} from "../../shared/typings";
import * as _ from 'lodash';

let allCodes;

export function isCodeExists(code: number) {
    function fetchCodes() {
        return new Promise((resolve) => {
            if (!allCodes) {
                return getJsonDocuments({type: 'product', whitelist: ['code']}).then((data) => {
                    allCodes = _.map(data.results, 'body.code');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    return fetchCodes().then(() => _.includes(allCodes, code));
}
