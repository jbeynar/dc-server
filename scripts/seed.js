'use strict';

const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));
const db = require('../libs/db');
const _ = require('lodash');

const SEED_DIR = 'seed/init';

return fs.readdirAsync(SEED_DIR).then((files) =>
{
    return promise.map(files, (file) =>
    {
        return fs.readFileAsync(SEED_DIR + '/' + file).then((script)=>
        {
            return script.toString();
        });
    });
}).then(function (scripts)
{
    return db.connect().then(function (client)
    {
        var queryPromises = [];
        _.forEach(scripts, function (sql)
        {
            queryPromises.push(client.query(sql));
        });
        return promise.all(queryPromises).then(()=>
        {
            client.done();
        }).catch((err)=>
        {
            db.exceptionHandler(err);
            console.error('Fatal error occurred while seeding. Failure exit.');
            process.exit(1);
        });
    });
});
