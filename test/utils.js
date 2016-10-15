'use strict';
var promise = require('bluebird');
var fs = promise.promisifyAll(require('fs'));
// TODO handle relative path, this implementation only let run it from app root
var fixturesPath = 'test/fixtures';
function getFixture(name) {
    return fs.readFileAsync([fixturesPath, name].join('/')).then(function (file) {
        return file.toString();
    });
}
exports.getFixture = getFixture;
//# sourceMappingURL=utils.js.map