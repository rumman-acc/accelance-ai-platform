"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAPIKey = exports.validateFlowAPIKey = void 0;
const apiKey_1 = require("./apiKey");
const apikey_1 = __importDefault(require("../services/apikey"));
/**
 * Validate flow API Key, this is needed because Prediction/Upsert API is public
 * @param {Request} req
 * @param {ChatFlow} chatflow
 */
const validateFlowAPIKey = async (req, chatflow) => {
    const chatFlowApiKeyId = chatflow?.apikeyid;
    if (!chatFlowApiKeyId)
        return true;
    const authorizationHeader = req.headers['Authorization'] ?? req.headers['authorization'] ?? '';
    if (chatFlowApiKeyId && !authorizationHeader)
        return false;
    const suppliedKey = authorizationHeader.split(`Bearer `).pop();
    if (!suppliedKey)
        return false;
    try {
        const apiKey = await apikey_1.default.getApiKeyById(chatFlowApiKeyId);
        if (!apiKey)
            return false;
        const apiKeyWorkSpaceId = apiKey.workspaceId;
        if (!apiKeyWorkSpaceId)
            return false;
        if (apiKeyWorkSpaceId !== chatflow.workspaceId)
            return false;
        const apiSecret = apiKey.apiSecret;
        if (!apiSecret || !(0, apiKey_1.compareKeys)(apiSecret, suppliedKey))
            return false;
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.validateFlowAPIKey = validateFlowAPIKey;
/**
 * Validate and Get API Key Information
 * @param {Request} req
 * @returns {Promise<{isValid: boolean, apiKey?: ApiKey}>}
 */
const validateAPIKey = async (req) => {
    const authorizationHeader = req.headers['Authorization'] ?? req.headers['authorization'] ?? '';
    if (!authorizationHeader)
        return { isValid: false };
    const suppliedKey = authorizationHeader.split(`Bearer `).pop();
    if (!suppliedKey)
        return { isValid: false };
    try {
        const apiKey = await apikey_1.default.getApiKey(suppliedKey);
        if (!apiKey)
            return { isValid: false };
        const apiKeyWorkSpaceId = apiKey.workspaceId;
        if (!apiKeyWorkSpaceId)
            return { isValid: false };
        const apiSecret = apiKey.apiSecret;
        if (!apiSecret || !(0, apiKey_1.compareKeys)(apiSecret, suppliedKey)) {
            return { isValid: false, apiKey };
        }
        return { isValid: true, apiKey };
    }
    catch (error) {
        return { isValid: false };
    }
};
exports.validateAPIKey = validateAPIKey;
//# sourceMappingURL=validateKey.js.map