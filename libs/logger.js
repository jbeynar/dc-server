'use strict';

function log(buffer, nl) {
    if (!process.env.LOGGER_SILENT) {
        process.stdout.write(buffer);
        if (nl) {
            process.stdout.write('\n').repeat(Number(nl));
        }
    }
}

function error() {
    if (!process.env.LOGGER_SILENT) {
        console.error.apply(null, arguments);
    }
}

module.exports = {
    log,
    error
};
