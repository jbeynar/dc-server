'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var typings_1 = require("../shared/typings");
var download = (function (_super) {
    __extends(download, _super);
    function download() {
        _super.apply(this, arguments);
        this.name = 'tarnowiak';
    }
    download.prototype.urls = function () {
        return ['http://www.tarnowiak.pl/'];
    };
    ;
    return download;
}(typings_1.TaskDownload));
exports.download = download;
;
var extract = (function (_super) {
    __extends(extract, _super);
    function extract() {
        _super.apply(this, arguments);
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
    return extract;
}(typings_1.TaskExtract));
exports.extract = extract;
;
