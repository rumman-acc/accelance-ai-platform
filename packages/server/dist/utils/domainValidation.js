"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPublicChatflowRequest = isPublicChatflowRequest;
exports.isTTSGenerateRequest = isTTSGenerateRequest;
exports.extractChatflowId = extractChatflowId;
exports.validateChatflowDomain = validateChatflowDomain;
exports.getUnauthorizedOriginError = getUnauthorizedOriginError;
const accelance_components_1 = require("accelance-components");
const chatflows_1 = __importDefault(require("../services/chatflows"));
const logger_1 = __importDefault(require("./logger"));
// List of allowed URL slugs for public access to chatbots
// It assumes the URL format includes one of the following patterns:
// /prediction/{chatflowId}.
// /public-chatbotConfig/{chatflowId}
// /chatflows-streaming/{chatflowId}
const ALLOWED_SLUGS = ['/prediction/', '/public-chatbotConfig/', '/chatflows-streaming/'];
// The TTS generate endpoint passes chatflowId in the request body, not the URL path
const TTS_GENERATE_PATH = '/api/text-to-speech/generate';
/**
 * Validates if the origin is allowed for a specific chatflow
 * @param chatflowId - The chatflow ID to validate against
 * @param origin - The origin URL to validate
 * @param workspaceId - Optional workspace ID for enterprise features
 * @returns Promise<boolean> - True if domain is allowed, false otherwise
 */
async function validateChatflowDomain(chatflowId, origin, workspaceId) {
    try {
        if (!chatflowId || !(0, accelance_components_1.isValidUUID)(chatflowId)) {
            throw new Error('Invalid chatflowId format - must be a valid UUID');
        }
        const chatflow = workspaceId
            ? await chatflows_1.default.getChatflowById(chatflowId, workspaceId)
            : await chatflows_1.default.getChatflowById(chatflowId);
        if (!chatflow?.chatbotConfig) {
            return true;
        }
        const config = JSON.parse(chatflow.chatbotConfig);
        // If no allowed origins configured or first entry is empty, allow all
        if (!config.allowedOrigins?.length || config.allowedOrigins[0] === '') {
            return true;
        }
        const originHost = new URL(origin).host;
        const isAllowed = config.allowedOrigins.some((domain) => {
            try {
                const allowedOrigin = new URL(domain).host;
                return originHost === allowedOrigin;
            }
            catch (error) {
                logger_1.default.warn(`Invalid domain format in allowedOrigins: ${domain}`);
                return false;
            }
        });
        return isAllowed;
    }
    catch (error) {
        logger_1.default.error(`Error validating domain for chatflow ${chatflowId}:`, error);
        return false;
    }
}
// NOTE: This function extracts the chatflow ID from a prediction URL.
// It assumes the URL format is /prediction/{chatflowId}.
/**
 * Extracts chatflow ID from prediction URL
 * @param url - The request URL
 * @returns string | null - The chatflow ID or null if not found
 */
function extractChatflowId(url) {
    try {
        const urlParts = url.split('/');
        const slug = extractSlugFromUrl(url);
        if (!slug)
            return null;
        const slugIndex = urlParts.indexOf(slug);
        if (slugIndex !== -1 && urlParts.length > slugIndex + 1) {
            const chatflowId = urlParts[slugIndex + 1];
            // Remove query parameters if present
            return chatflowId.split('?')[0];
        }
        return null;
    }
    catch (error) {
        logger_1.default.error('Error extracting chatflow ID from URL:', error);
        return null;
    }
}
/**
 * Extracts the slug from the URL if it matches any of the allowed slugs
 * @param url - The request URL
 * @returns string | null - The matched slug or null if no match
 */
function extractSlugFromUrl(url) {
    for (const publicUrl of ALLOWED_SLUGS) {
        if (url.includes(publicUrl)) {
            return publicUrl.replace(/\//g, ''); // remove slashes
        }
    }
    return null;
}
/**
 * Validates if a request is for public chatflows (embedded chatbots)
 * @param url - The request URL
 * @returns boolean - True if it's a public chatflow request
 */
function isPublicChatflowRequest(url) {
    return extractSlugFromUrl(url) !== null;
}
/**
 * Checks if the request is for the TTS generate endpoint.
 * This endpoint passes chatflowId in the request body rather than the URL path.
 * @param url - The request URL
 * @returns boolean - True if it's the TTS generate endpoint
 */
function isTTSGenerateRequest(url) {
    return url.split('?')[0] === TTS_GENERATE_PATH;
}
/**
 * Get the custom error message for unauthorized origin
 * @param chatflowId - The chatflow ID
 * @param workspaceId - Optional workspace ID
 * @returns Promise<string> - Custom error message or default
 */
async function getUnauthorizedOriginError(chatflowId, workspaceId) {
    try {
        const chatflow = workspaceId
            ? await chatflows_1.default.getChatflowById(chatflowId, workspaceId)
            : await chatflows_1.default.getChatflowById(chatflowId);
        if (chatflow?.chatbotConfig) {
            const config = JSON.parse(chatflow.chatbotConfig);
            return config.allowedOriginsError || 'This site is not allowed to access this chatbot';
        }
        return 'This site is not allowed to access this chatbot';
    }
    catch (error) {
        logger_1.default.error(`Error getting unauthorized origin error for chatflow ${chatflowId}:`, error);
        return 'This site is not allowed to access this chatbot';
    }
}
//# sourceMappingURL=domainValidation.js.map