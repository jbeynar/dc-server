'use strict';

function RuntimeError(message, step) {
    this.message = message;
    this.step = step;
    this.toString = function () {
        return `${message}\n${JSON.stringify(step, null, 3)}`;
    };
}

module.exports = {
    RuntimeError,
    ERRORS: {
        NOT_IMPLEMENTED_YET: 'Not implemented yet',
        UNSUPPORTED_OPERATOR: 'Unsupported operator',
        UNSUPPORTED_BODY_EXPRSSION: 'Unsupported body expression'
    }
};
