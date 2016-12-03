'use strict';

import _ = require('lodash');
import {config} from "../config";

export function log(buffer : string, nl? : number) {
    if (config.logger.enabled) {
        process.stdout.write(buffer);
        if (nl) {
            process.stdout.write(_.repeat('\n', Number(nl)));
        }
    }
}

export function error(...args): void;
export function error():void {
    if (config.logger.enabled) {
        console.error.apply(null, arguments);
    }
}
