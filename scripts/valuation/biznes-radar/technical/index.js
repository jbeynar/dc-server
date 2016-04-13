const downloadDocuments = require('./download.js');
const importDocuments = require('./import.js');

downloadDocuments().then(importDocuments);
