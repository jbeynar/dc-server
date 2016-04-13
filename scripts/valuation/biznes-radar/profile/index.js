const downloadProfiles = require('./download.js');
const importProfiles = require('./import.js');

downloadProfiles().then(importProfiles);
