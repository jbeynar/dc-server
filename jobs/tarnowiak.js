'use strict';
exports.download = {
    type: 'download',
    urls: ['http://www.tarnowiak.pl/']
};
exports.extract = {
    type: 'extract',
    sourceHttpDocuments: {
        host: 'www.tarnowiak.pl'
    },
    targetJsonDocuments: {
        typeName: 'tarnowiak',
        autoRemove: true
    },
    scope: '#content div.box_content_info',
    map: {
        name: {
            singular: true,
            selector: 'div.box_content_desc > strong'
        }
    }
};
//# sourceMappingURL=tarnowiak.js.map