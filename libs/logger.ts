'use strict';

import _ = require('lodash');

export function log(buffer : string, nl? : number) {
    if (!process.env.LOGGER_SILENT) {
        process.stdout.write(buffer);
        if (nl) {
            process.stdout.write(_.repeat('\n', Number(nl)));
        }
    }
}

export function error(...args): void;
export function error():void {
    // todo somehow handle vararg signature
    if (!process.env.LOGGER_SILENT) {
        console.error.apply(null, arguments);
    }
}
