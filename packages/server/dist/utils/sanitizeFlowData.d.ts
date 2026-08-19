/**
 * Sanitizes flowData before returning it from a public endpoint.
 * Strips password/file/folder inputs, credential ID references, and
 * auth-related HTTP headers so sensitive credentials are never exposed.
 */
export declare const sanitizeFlowDataForPublicEndpoint: (flowDataString: string) => string;
