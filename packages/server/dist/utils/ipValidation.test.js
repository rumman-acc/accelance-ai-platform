"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const ipValidation_1 = require("./ipValidation");
(0, globals_1.describe)('IP Address Validation Utilities', () => {
    (0, globals_1.describe)('isValidIPAddress', () => {
        (0, globals_1.describe)('Valid IPv4 addresses', () => {
            (0, globals_1.it)('should return true for standard IPv4 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('192.168.1.1')).toBe(true);
            });
            (0, globals_1.it)('should return true for localhost IPv4', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('127.0.0.1')).toBe(true);
            });
            (0, globals_1.it)('should return true for 0.0.0.0', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('0.0.0.0')).toBe(true);
            });
            (0, globals_1.it)('should return true for 255.255.255.255', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('255.255.255.255')).toBe(true);
            });
            (0, globals_1.it)('should return true for public IPv4', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('8.8.8.8')).toBe(true);
            });
            (0, globals_1.it)('should return true for private IPv4 (10.x.x.x)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('10.0.0.1')).toBe(true);
            });
            (0, globals_1.it)('should return true for private IPv4 (172.16.x.x)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('172.16.0.1')).toBe(true);
            });
            (0, globals_1.it)('should return true for private IPv4 (192.168.x.x)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('192.168.0.1')).toBe(true);
            });
        });
        (0, globals_1.describe)('Valid IPv6 addresses', () => {
            (0, globals_1.it)('should return true for full IPv6 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
            });
            (0, globals_1.it)('should return true for compressed IPv6 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('2001:db8:85a3::8a2e:370:7334')).toBe(true);
            });
            (0, globals_1.it)('should return true for IPv6 localhost (::1)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('::1')).toBe(true);
            });
            (0, globals_1.it)('should return true for IPv6 unspecified address (::)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('::')).toBe(true);
            });
            (0, globals_1.it)('should return true for IPv6 with zeros compressed', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('fe80::1')).toBe(true);
            });
            (0, globals_1.it)('should return true for IPv6 link-local address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('fe80::a00:27ff:fe4e:66a1')).toBe(true);
            });
            (0, globals_1.it)('should return true for IPv4-mapped IPv6 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('::ffff:192.168.1.1')).toBe(true);
            });
        });
        (0, globals_1.describe)('Invalid IP addresses', () => {
            (0, globals_1.it)('should return false for empty string', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('')).toBe(false);
            });
            (0, globals_1.it)('should return false for undefined', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)(undefined)).toBe(false);
            });
            (0, globals_1.it)('should return false for null', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)(null)).toBe(false);
            });
            (0, globals_1.it)('should return false for non-string input', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)(123)).toBe(false);
            });
            (0, globals_1.it)('should return false for invalid IPv4 (too many octets)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('192.168.1.1.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for invalid IPv4 (octet > 255)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('192.168.256.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for invalid IPv4 (negative octet)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('192.168.-1.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for invalid IPv4 (too few octets)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('192.168.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for hostname', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('example.com')).toBe(false);
            });
            (0, globals_1.it)('should return false for URL', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('http://192.168.1.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for invalid IPv6 (too many segments)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('2001:0db8:85a3:0000:0000:8a2e:0370:7334:extra')).toBe(false);
            });
            (0, globals_1.it)('should return false for malformed IPv6', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('gggg::1')).toBe(false);
            });
            (0, globals_1.it)('should return false for random string', () => {
                (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('not-an-ip')).toBe(false);
            });
        });
    });
    (0, globals_1.describe)('isIPv4', () => {
        (0, globals_1.describe)('Valid IPv4 addresses', () => {
            (0, globals_1.it)('should return true for standard IPv4 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('192.168.1.1')).toBe(true);
            });
            (0, globals_1.it)('should return true for localhost IPv4', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('127.0.0.1')).toBe(true);
            });
            (0, globals_1.it)('should return true for 0.0.0.0', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('0.0.0.0')).toBe(true);
            });
            (0, globals_1.it)('should return true for 255.255.255.255', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('255.255.255.255')).toBe(true);
            });
            (0, globals_1.it)('should return true for public IPv4 (8.8.8.8)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('8.8.8.8')).toBe(true);
            });
            (0, globals_1.it)('should return true for public IPv4 (1.1.1.1)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('1.1.1.1')).toBe(true);
            });
        });
        (0, globals_1.describe)('Invalid or non-IPv4 addresses', () => {
            (0, globals_1.it)('should return false for IPv6 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('2001:db8:85a3::8a2e:370:7334')).toBe(false);
            });
            (0, globals_1.it)('should return false for IPv6 localhost', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('::1')).toBe(false);
            });
            (0, globals_1.it)('should return false for IPv4-mapped IPv6 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('::ffff:192.168.1.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for invalid IPv4', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('192.168.256.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for empty string', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('')).toBe(false);
            });
            (0, globals_1.it)('should return false for hostname', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv4)('example.com')).toBe(false);
            });
        });
    });
    (0, globals_1.describe)('isIPv6', () => {
        (0, globals_1.describe)('Valid IPv6 addresses', () => {
            (0, globals_1.it)('should return true for full IPv6 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
            });
            (0, globals_1.it)('should return true for compressed IPv6 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('2001:db8:85a3::8a2e:370:7334')).toBe(true);
            });
            (0, globals_1.it)('should return true for IPv6 localhost (::1)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('::1')).toBe(true);
            });
            (0, globals_1.it)('should return true for IPv6 unspecified address (::)', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('::')).toBe(true);
            });
            (0, globals_1.it)('should return true for link-local IPv6', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('fe80::1')).toBe(true);
            });
            (0, globals_1.it)('should return true for IPv4-mapped IPv6 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('::ffff:192.168.1.1')).toBe(true);
            });
            (0, globals_1.it)('should return true for global unicast IPv6', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('2607:f8b0:4005:805::200e')).toBe(true);
            });
        });
        (0, globals_1.describe)('Invalid or non-IPv6 addresses', () => {
            (0, globals_1.it)('should return false for IPv4 address', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('192.168.1.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for IPv4 localhost', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('127.0.0.1')).toBe(false);
            });
            (0, globals_1.it)('should return false for invalid IPv6', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('gggg::1')).toBe(false);
            });
            (0, globals_1.it)('should return false for empty string', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('')).toBe(false);
            });
            (0, globals_1.it)('should return false for hostname', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('example.com')).toBe(false);
            });
            (0, globals_1.it)('should return false for malformed IPv6', () => {
                (0, globals_1.expect)((0, ipValidation_1.isIPv6)('2001:0db8:85a3:0000:0000:8a2e:0370:7334:extra')).toBe(false);
            });
        });
    });
    (0, globals_1.describe)('Edge cases and security considerations', () => {
        (0, globals_1.it)('isValidIPAddress should handle whitespace-trimmed input', () => {
            // Note: Node's isIP doesn't auto-trim, so these should fail
            (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)(' 192.168.1.1 ')).toBe(false);
        });
        (0, globals_1.it)('isValidIPAddress should reject IP with port number', () => {
            (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('192.168.1.1:8080')).toBe(false);
        });
        (0, globals_1.it)('isIPv4 should reject IPv4 with CIDR notation', () => {
            (0, globals_1.expect)((0, ipValidation_1.isIPv4)('192.168.1.0/24')).toBe(false);
        });
        (0, globals_1.it)('isIPv6 should reject IPv6 with CIDR notation', () => {
            (0, globals_1.expect)((0, ipValidation_1.isIPv6)('2001:db8::/32')).toBe(false);
        });
        (0, globals_1.it)('should handle special IPv4 addresses correctly', () => {
            (0, globals_1.expect)((0, ipValidation_1.isIPv4)('169.254.0.1')).toBe(true); // Link-local
            (0, globals_1.expect)((0, ipValidation_1.isIPv4)('224.0.0.1')).toBe(true); // Multicast
            (0, globals_1.expect)((0, ipValidation_1.isIPv4)('255.255.255.255')).toBe(true); // Broadcast
        });
        (0, globals_1.it)('should handle special IPv6 addresses correctly', () => {
            (0, globals_1.expect)((0, ipValidation_1.isIPv6)('ff02::1')).toBe(true); // Multicast
            (0, globals_1.expect)((0, ipValidation_1.isIPv6)('fc00::1')).toBe(true); // Unique local address
        });
    });
    (0, globals_1.describe)('Type safety', () => {
        (0, globals_1.it)('should handle various falsy values gracefully', () => {
            (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)('')).toBe(false);
            (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)(null)).toBe(false);
            (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)(undefined)).toBe(false);
        });
        (0, globals_1.it)('should handle non-string types gracefully', () => {
            (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)(123)).toBe(false);
            (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)({})).toBe(false);
            (0, globals_1.expect)((0, ipValidation_1.isValidIPAddress)([])).toBe(false);
        });
    });
});
//# sourceMappingURL=ipValidation.test.js.map