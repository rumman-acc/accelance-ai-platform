"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDeniedIP = isDeniedIP;
exports.checkDenyList = checkDenyList;
exports.secureAxiosRequest = secureAxiosRequest;
exports.secureFetch = secureFetch;
const axios_1 = __importDefault(require("axios"));
const promises_1 = __importDefault(require("dns/promises"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const ipaddr = __importStar(require("ipaddr.js"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const DEFAULT_DENY_LIST = [
    '0.0.0.0',
    '10.0.0.0/8',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '169.254.169.253',
    '169.254.169.254',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '224.0.0.0/4',
    '240.0.0.0/4',
    '255.255.255.255/32',
    '::1',
    'fc00::/7',
    'fd00:ec2::254',
    'fe80::/10',
    'ff00::/8',
    'localhost',
    'ip6-localhost'
];
/**
 * Gets the HTTP deny list.
 * When HTTP_SECURITY_CHECK=false, the default deny list is omitted and only
 * HTTP_DENY_LIST entries are used. Defaults to true (secure).
 * @returns Array of denied IP addresses, hostnames, or CIDR ranges
 */
function getHttpDenyList() {
    const securityCheckEnabled = process.env.HTTP_SECURITY_CHECK !== 'false';
    const httpDenyListString = process.env.HTTP_DENY_LIST;
    const customList = httpDenyListString
        ? httpDenyListString
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    if (securityCheckEnabled) {
        return [...new Set([...DEFAULT_DENY_LIST, ...customList])];
    }
    return customList;
}
/**
 * Checks if an IP address is in the deny list
 * @param ip - IP address to check
 * @param denyList - Array of denied IP addresses/CIDR ranges
 * @throws Error if IP is in deny list
 */
function isDeniedIP(ip, denyList) {
    let parsedIp = ipaddr.parse(ip);
    // Normalize IPv4-mapped IPv6 addresses to IPv4 before checking
    // This prevents bypass of IPv4 deny list rules via ::ffff:x.x.x.x addresses
    if (parsedIp.kind() === 'ipv6') {
        const ipv6Addr = parsedIp;
        if (ipv6Addr.isIPv4MappedAddress()) {
            parsedIp = ipv6Addr.toIPv4Address();
        }
    }
    for (const entry of denyList) {
        if (entry.includes('/')) {
            try {
                const [rangeAddr, mask] = ipaddr.parseCIDR(entry);
                let parsedRange = rangeAddr;
                let adjustedMask = mask;
                // Also normalize deny list entries
                if (parsedRange.kind() === 'ipv6' && parsedRange.isIPv4MappedAddress()) {
                    if (mask < 96)
                        continue; // malformed IPv4-mapped CIDR — skip
                    parsedRange = parsedRange.toIPv4Address();
                    adjustedMask -= 96;
                }
                if (parsedIp.kind() === parsedRange.kind()) {
                    if (parsedIp.match(parsedRange, adjustedMask)) {
                        throw new Error('Access to this host is denied by policy.');
                    }
                }
            }
            catch (error) {
                throw new Error(`isDeniedIP: ${error}`);
            }
        }
        else {
            // Try to parse and normalize the deny list entry for consistent comparison
            // This handles non-canonical IPv6 addresses (e.g., FE80::1, 2001:0DB8::1)
            if (ipaddr.isValid(entry)) {
                let parsedEntry = ipaddr.parse(entry);
                // Normalize IPv4-mapped IPv6 entries
                if (parsedEntry.kind() === 'ipv6' && parsedEntry.isIPv4MappedAddress()) {
                    parsedEntry = parsedEntry.toIPv4Address();
                }
                // Compare normalized forms
                if (parsedIp.toString() === parsedEntry.toString()) {
                    throw new Error('Access to this host is denied by policy.');
                }
            }
            else {
                // Not a valid IP - compare as-is (e.g., hostname like "localhost")
                if (parsedIp.toString() === entry) {
                    throw new Error('Access to this host is denied by policy.');
                }
            }
        }
    }
}
/**
 * Checks if a URL is allowed based on HTTP_DENY_LIST environment variable.
 * @param url - URL to check
 * @throws Error if URL hostname resolves to a denied IP
 */
async function checkDenyList(url) {
    const httpDenyList = getHttpDenyList();
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    // Strip IPv6 brackets if present
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
        hostname = hostname.slice(1, -1);
    }
    if (ipaddr.isValid(hostname)) {
        isDeniedIP(hostname, httpDenyList);
    }
    else {
        const addresses = await promises_1.default.lookup(hostname, { all: true });
        for (const address of addresses) {
            isDeniedIP(address.address, httpDenyList);
        }
    }
}
/**
 * Makes a secure HTTP request that validates all URLs in redirect chains against the deny list
 * @param config - Axios request configuration (httpsAgent/httpAgent are ignored; use agentOptions for custom CA)
 * @param maxRedirects - Maximum number of redirects to follow (default: 5)
 * @param agentOptions - Optional TLS options (e.g. { ca } for custom CA PEM)
 * @returns Promise<AxiosResponse>
 * @throws Error if any URL in the redirect chain is denied
 */
async function secureAxiosRequest(config, maxRedirects = 5, agentOptions) {
    let currentUrl = config.url;
    if (!currentUrl) {
        throw new Error('secureAxiosRequest: url is required');
    }
    let redirects = 0;
    let currentConfig = {
        ...config,
        maxRedirects: 0,
        validateStatus: () => true,
        httpsAgent: undefined,
        httpAgent: undefined
    }; // Disable automatic redirects; agents set per-request below
    while (redirects <= maxRedirects) {
        const target = await resolveAndValidate(currentUrl);
        const agent = createPinnedAgent(target, agentOptions);
        currentConfig = {
            ...currentConfig,
            url: currentUrl,
            ...(target.protocol === 'http' ? { httpAgent: agent } : { httpsAgent: agent }),
            headers: {
                ...currentConfig.headers,
                Host: target.hostname
            }
        };
        const response = await (0, axios_1.default)(currentConfig);
        // If it's a successful response (not a redirect), return it
        if (response.status < 300 || response.status >= 400) {
            return response;
        }
        // Handle redirect
        const location = response.headers.location;
        if (!location) {
            // No location header, but it's a redirect status - return the response
            return response;
        }
        redirects++;
        if (redirects > maxRedirects) {
            throw new Error('Too many redirects');
        }
        currentUrl = new URL(location, currentUrl).toString();
        // For redirects, we only need to preserve certain headers and change method if needed
        if (response.status === 301 || response.status === 302 || response.status === 303) {
            // For 303, or when redirecting POST requests, change to GET
            if (response.status === 303 ||
                (currentConfig.method && ['POST', 'PUT', 'PATCH'].includes(currentConfig.method.toUpperCase()))) {
                currentConfig.method = 'GET';
                delete currentConfig.data;
            }
        }
    }
    throw new Error('Too many redirects');
}
/**
 * Makes a secure fetch request that validates all URLs in redirect chains against the deny list
 * @param url - URL to fetch
 * @param init - Fetch request options
 * @param maxRedirects - Maximum number of redirects to follow (default: 5)
 * @param agentOptions - Optional TLS options (e.g. { ca } for custom CA PEM)
 * @returns Promise<Response>
 * @throws Error if any URL in the redirect chain is denied
 */
async function secureFetch(url, init, maxRedirects = 5, agentOptions) {
    let currentUrl = url;
    let redirectCount = 0;
    let currentInit = { ...init, redirect: 'manual' }; // Disable automatic redirects
    while (redirectCount <= maxRedirects) {
        const resolved = await resolveAndValidate(currentUrl);
        const agent = createPinnedAgent(resolved, agentOptions);
        const response = await (0, node_fetch_1.default)(currentUrl, { ...currentInit, agent: () => agent });
        // If it's a successful response (not a redirect), return it
        if (response.status < 300 || response.status >= 400) {
            return response;
        }
        // Handle redirect
        const location = response.headers.get('location');
        if (!location) {
            // No location header, but it's a redirect status - return the response
            return response;
        }
        redirectCount++;
        if (redirectCount > maxRedirects) {
            throw new Error('Too many redirects');
        }
        // Resolve the redirect URL (handle relative URLs)
        currentUrl = new URL(location, currentUrl).toString();
        // Handle method changes for redirects according to HTTP specs
        if (response.status === 301 || response.status === 302 || response.status === 303) {
            // For 303, or when redirecting POST/PUT/PATCH requests, change to GET
            if (response.status === 303 || (currentInit.method && ['POST', 'PUT', 'PATCH'].includes(currentInit.method.toUpperCase()))) {
                currentInit = {
                    ...currentInit,
                    method: 'GET',
                    body: undefined
                };
            }
        }
    }
    throw new Error('Too many redirects');
}
async function resolveAndValidate(url) {
    const denyList = getHttpDenyList();
    const u = new URL(url);
    let hostname = u.hostname;
    // Strip IPv6 brackets if present
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
        hostname = hostname.slice(1, -1);
    }
    const protocol = u.protocol === 'https:' ? 'https' : 'http';
    if (ipaddr.isValid(hostname)) {
        isDeniedIP(hostname, denyList);
        return {
            hostname,
            ip: hostname,
            family: hostname.includes(':') ? 6 : 4,
            protocol
        };
    }
    const records = await promises_1.default.lookup(hostname, { all: true });
    if (records.length === 0) {
        throw new Error(`DNS resolution failed for ${hostname}`);
    }
    for (const r of records) {
        isDeniedIP(r.address, denyList);
    }
    const chosen = records.find((r) => r.family === 4) ?? records[0];
    return {
        hostname,
        ip: chosen.address,
        family: chosen.family,
        protocol
    };
}
function createPinnedAgent(target, options) {
    const Agent = target.protocol === 'https' ? https_1.default.Agent : http_1.default.Agent;
    return new Agent({
        lookup: (_host, _opts, cb) => {
            cb(null, target.ip, target.family);
        },
        ...options
    });
}
//# sourceMappingURL=httpSecurity.js.map