import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { RequestInit, Response } from 'node-fetch'
/**
 * Checks if an IP address is in the deny list
 * @param ip - IP address to check
 * @param denyList - Array of denied IP addresses/CIDR ranges
 * @throws Error if IP is in deny list
 */
export declare function isDeniedIP(ip: string, denyList: string[]): void
/**
 * Checks if a URL is allowed based on HTTP_DENY_LIST environment variable.
 * @param url - URL to check
 * @throws Error if URL hostname resolves to a denied IP
 */
export declare function checkDenyList(url: string): Promise<void>
/**
 * Optional TLS options for secureAxiosRequest (e.g. custom CA for mutual TLS or private CAs).
 */
export interface SecureRequestAgentOptions {
    ca?: string | string[] | Buffer
}
/**
 * Makes a secure HTTP request that validates all URLs in redirect chains against the deny list
 * @param config - Axios request configuration (httpsAgent/httpAgent are ignored; use agentOptions for custom CA)
 * @param maxRedirects - Maximum number of redirects to follow (default: 5)
 * @param agentOptions - Optional TLS options (e.g. { ca } for custom CA PEM)
 * @returns Promise<AxiosResponse>
 * @throws Error if any URL in the redirect chain is denied
 */
export declare function secureAxiosRequest(
    config: AxiosRequestConfig,
    maxRedirects?: number,
    agentOptions?: SecureRequestAgentOptions
): Promise<AxiosResponse>
/**
 * Makes a secure fetch request that validates all URLs in redirect chains against the deny list
 * @param url - URL to fetch
 * @param init - Fetch request options
 * @param maxRedirects - Maximum number of redirects to follow (default: 5)
 * @param agentOptions - Optional TLS options (e.g. { ca } for custom CA PEM)
 * @returns Promise<Response>
 * @throws Error if any URL in the redirect chain is denied
 */
export declare function secureFetch(
    url: string,
    init?: RequestInit,
    maxRedirects?: number,
    agentOptions?: SecureRequestAgentOptions
): Promise<Response>
