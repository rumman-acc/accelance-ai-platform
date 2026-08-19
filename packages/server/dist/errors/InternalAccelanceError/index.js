"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalAccelanceError = void 0;
class InternalAccelanceError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        // capture the stack trace of the error from anywhere in the application
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.InternalAccelanceError = InternalAccelanceError;
//# sourceMappingURL=index.js.map