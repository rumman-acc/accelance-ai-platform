"use strict";
// packages/server/src/utils/ipValidation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIPAddress = isValidIPAddress;
exports.isIPv4 = isIPv4;
exports.isIPv6 = isIPv6;
const net_1 = require("net");
/**
 * Validates if a string is a valid IPv4 or IPv6 address.
 *
 * Uses Node.js built-in `net.isIP()` for robust validation that handles
 * standard formats, IPv4-mapped IPv6 addresses, and compressed IPv6 notation.
 *
 * @param ip - The IP address string to validate
 * @returns `true` if the string is a valid IPv4 or IPv6 address, `false` otherwise
 */
function isValidIPAddress(ip) {
    if (!ip || typeof ip !== 'string')
        return false;
    return (0, net_1.isIP)(ip) !== 0; // Returns 4 for IPv4, 6 for IPv6, 0 for invalid
}
/**
 * Checks if a string is a valid IPv4 address.
 *
 * Uses Node.js built-in `net.isIP()` to determine if the address
 * is specifically IPv4 format.
 *
 * @param ip - The IP address string to validate
 * @returns `true` if the string is a valid IPv4 address, `false` otherwise
 */
function isIPv4(ip) {
    return (0, net_1.isIP)(ip) === 4;
}
/**
 * Checks if a string is a valid IPv6 address.
 *
 * Uses Node.js built-in `net.isIP()` to determine if the address
 * is specifically IPv6 format (including compressed notation and IPv4-mapped addresses).
 *
 * @param ip - The IP address string to validate
 * @returns `true` if the string is a valid IPv6 address, `false` otherwise
 */
function isIPv6(ip) {
    return (0, net_1.isIP)(ip) === 6;
}
//# sourceMappingURL=ipValidation.js.map