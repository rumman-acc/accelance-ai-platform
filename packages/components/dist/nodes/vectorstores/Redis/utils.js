"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unEscapeSpecialChars = exports.escapeAllStrings = exports.escapeSpecialChars = void 0;
const lodash_1 = require("lodash");
/*
 * Escapes all '-' characters.
 * Redis Search considers '-' as a negative operator, hence we need
 * to escape it
 */
const escapeSpecialChars = (str) => {
    return str.replaceAll('-', '\\-');
};
exports.escapeSpecialChars = escapeSpecialChars;
const escapeAllStrings = (obj) => {
    if ((0, lodash_1.isNil)(obj)) {
        // return if obj is null or undefined to avoid "TypeError: Cannot convert undefined or null to object"
        return;
    }
    Object.keys(obj).forEach((key) => {
        // @ts-ignore
        let item = obj[key];
        if (typeof item === 'object') {
            (0, exports.escapeAllStrings)(item);
        }
        else if (typeof item === 'string') {
            // @ts-ignore
            obj[key] = (0, exports.escapeSpecialChars)(item);
        }
    });
};
exports.escapeAllStrings = escapeAllStrings;
const unEscapeSpecialChars = (str) => {
    return str.replaceAll('\\-', '-');
};
exports.unEscapeSpecialChars = unEscapeSpecialChars;
//# sourceMappingURL=utils.js.map