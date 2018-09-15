'use strict';

import _ = require('lodash');
import {config} from "../config";

export function log(buffer: string, nl?: number) {
    if (config.logger.enabled) {
        let output = buffer;
        if (nl) {
            output += _.repeat('\n', Number(nl));
        }
        process.stdout.write(output);
    }
}

export function error(...args): void;

export function error(err): void {
    if (config.logger.enabled) {
        console.error.apply(null, arguments);
    }
}
