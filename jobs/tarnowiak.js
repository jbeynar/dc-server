'use strict';
exports.download = {
    type: 'download',
    name: 'tarnowiak',
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
        },
        link: {
            singular: true,
            selector: 'p>a',
            attribute: 'href'
        }
    }
};
//# sourceMappingURL=tarnowiak.js.map