/**
 * Validates if a string is a valid IPv4 or IPv6 address.
 *
 * Uses Node.js built-in `net.isIP()` for robust validation that handles
 * standard formats, IPv4-mapped IPv6 addresses, and compressed IPv6 notation.
 *
 * @param ip - The IP address string to validate
 * @returns `true` if the string is a valid IPv4 or IPv6 address, `false` otherwise
 */
export declare function isValidIPAddress(ip: string): boolean;
/**
 * Checks if a string is a valid IPv4 address.
 *
 * Uses Node.js built-in `net.isIP()` to determine if the address
 * is specifically IPv4 format.
 *
 * @param ip - The IP address string to validate
 * @returns `true` if the string is a valid IPv4 address, `false` otherwise
 */
export declare function isIPv4(ip: string): boolean;
/**
 * Checks if a string is a valid IPv6 address.
 *
 * Uses Node.js built-in `net.isIP()` to determine if the address
 * is specifically IPv6 format (including compressed notation and IPv4-mapped addresses).
 *
 * @param ip - The IP address string to validate
 * @returns `true` if the string is a valid IPv6 address, `false` otherwise
 */
export declare function isIPv6(ip: string): boolean;
