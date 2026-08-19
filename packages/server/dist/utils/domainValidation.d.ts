/**
 * Validates if the origin is allowed for a specific chatflow
 * @param chatflowId - The chatflow ID to validate against
 * @param origin - The origin URL to validate
 * @param workspaceId - Optional workspace ID for enterprise features
 * @returns Promise<boolean> - True if domain is allowed, false otherwise
 */
declare function validateChatflowDomain(chatflowId: string, origin: string, workspaceId?: string): Promise<boolean>;
/**
 * Extracts chatflow ID from prediction URL
 * @param url - The request URL
 * @returns string | null - The chatflow ID or null if not found
 */
declare function extractChatflowId(url: string): string | null;
/**
 * Validates if a request is for public chatflows (embedded chatbots)
 * @param url - The request URL
 * @returns boolean - True if it's a public chatflow request
 */
declare function isPublicChatflowRequest(url: string): boolean;
/**
 * Checks if the request is for the TTS generate endpoint.
 * This endpoint passes chatflowId in the request body rather than the URL path.
 * @param url - The request URL
 * @returns boolean - True if it's the TTS generate endpoint
 */
declare function isTTSGenerateRequest(url: string): boolean;
/**
 * Get the custom error message for unauthorized origin
 * @param chatflowId - The chatflow ID
 * @param workspaceId - Optional workspace ID
 * @returns Promise<string> - Custom error message or default
 */
declare function getUnauthorizedOriginError(chatflowId: string, workspaceId?: string): Promise<string>;
export { isPublicChatflowRequest, isTTSGenerateRequest, extractChatflowId, validateChatflowDomain, getUnauthorizedOriginError };
