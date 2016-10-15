'use strict';

import rfr = require('rfr');
import promise = require('bluebird');
const fs : any = promise.promisifyAll(require('fs'));

// TODO handle relative path, this implementation only let run it from app root
const fixturesPath = 'test/fixtures';

export function getFixture(name)
{
    return fs.readFileAsync([fixturesPath, name].join('/')).then((file)=>
    {
        return file.toString();
    });
}
