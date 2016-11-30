'use strict';
const typings_1 = require("../shared/typings");
class download extends typings_1.TaskDownload {
    constructor() {
        super(...arguments);
        this.name = 'tarnowiak';
    }
    urls() {
        return ['http://www.tarnowiak.pl/'];
    }
    ;
}
exports.download = download;
;
class extract extends typings_1.TaskExtract {
    constructor() {
        super(...arguments);
        this.sourceHttpDocuments = {
            host: 'www.tarnowiak.pl'
        };
        this.targetJsonDocuments = {
            typeName: 'tarnowiak',
            autoRemove: true
        };
        this.scope = '#content div.box_content_info';
        this.map = {
            name: {
                singular: true,
                selector: 'div.box_content_desc > strong'
            },
            link: {
                singular: true,
                selector: 'p>a',
                attribute: 'href'
            }
        };
    }
}
exports.extract = extract;
;
//# sourceMappingURL=tarnowiak.js.map