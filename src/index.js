'use strict';

const jobLib = require('job');
const exampleJob = require('fake-site.job');

jobLib.executeJob(exampleJob).subscribe(console.log);
