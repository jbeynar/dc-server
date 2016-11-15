'use strict';
const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));
// TODO handle relative path, this implementation only let run it from app root
const fixturesPath = 'test/fixtures';
function getFixture(name) {
    return fs.readFileAsync([fixturesPath, name].join('/')).then((file) => {
        return file.toString();
    });
}
exports.getFixture = getFixture;
//# sourceMappingURL=utils.js.map