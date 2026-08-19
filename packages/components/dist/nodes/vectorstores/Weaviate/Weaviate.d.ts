/**
 * Parses a host string into host and optional port.
 * Handles IPv6 bracket notation (e.g. "[::1]:8080") and plain "host:port".
 */
export declare function parseHostPort(host: string): {
    host: string
    port?: number
}
