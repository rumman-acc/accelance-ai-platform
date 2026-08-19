"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const crypto_1 = __importDefault(require("crypto"));
const v3_1 = require("zod/v3");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const toolNameSchema = v3_1.z
    .string()
    .min(1, 'toolName is required')
    .max(64, 'toolName must be 64 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'toolName must contain only alphanumeric characters, underscores, and hyphens');
const createConfigSchema = v3_1.z.object({
    toolName: toolNameSchema,
    description: v3_1.z.string().min(1, 'description is required')
});
const updateConfigSchema = v3_1.z.object({
    toolName: toolNameSchema.optional(),
    description: v3_1.z.string().min(1, 'description cannot be empty').optional(),
    enabled: v3_1.z.boolean().optional()
});
function validateWithZod(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, result.error.errors[0].message);
    }
    return result.data;
}
/**
 * Generate a random 32-char hex token (128 bits of entropy)
 */
function generateToken() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
/**
 * Parse the mcpServerConfig JSON string from a ChatFlow entity
 */
function parseMcpConfig(chatflow) {
    if (!chatflow.mcpServerConfig)
        return null;
    try {
        return JSON.parse(chatflow.mcpServerConfig);
    }
    catch {
        return null;
    }
}
/**
 * Get MCP server config for a chatflow
 */
const getMcpServerConfig = async (chatflowId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: { id: chatflowId, workspaceId }
        });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const config = parseMcpConfig(chatflow);
        return config || { enabled: false, token: '', description: '', toolName: '' };
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: mcpServerService.getMcpServerConfig - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Enable MCP server for a chatflow — generates a token and saves config
 */
const createMcpServerConfig = async (chatflowId, workspaceId, body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: { id: chatflowId, workspaceId }
        });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        // If already has an MCP config, return it
        const existing = parseMcpConfig(chatflow);
        if (existing && existing.enabled) {
            return existing;
        }
        validateWithZod(createConfigSchema, body);
        const config = {
            enabled: true,
            token: generateToken(),
            description: body.description,
            toolName: body.toolName
        };
        chatflow.mcpServerConfig = JSON.stringify(config);
        await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
        return config;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: mcpServerService.createMcpServerConfig - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Update MCP server config (description, toolName, enabled/disabled)
 */
const updateMcpServerConfig = async (chatflowId, workspaceId, body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: { id: chatflowId, workspaceId }
        });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const existing = parseMcpConfig(chatflow);
        if (!existing) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `MCP server config not found for ID: ${chatflowId}`);
        }
        validateWithZod(updateConfigSchema, body);
        if (body.description !== undefined)
            existing.description = body.description;
        if (body.toolName !== undefined)
            existing.toolName = body.toolName;
        if (body.enabled !== undefined)
            existing.enabled = body.enabled;
        chatflow.mcpServerConfig = JSON.stringify(existing);
        await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
        return existing;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: mcpServerService.updateMcpServerConfig - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Disable (soft delete) MCP server config
 */
const deleteMcpServerConfig = async (chatflowId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: { id: chatflowId, workspaceId }
        });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const existing = parseMcpConfig(chatflow);
        if (!existing)
            return;
        existing.enabled = false;
        chatflow.mcpServerConfig = JSON.stringify(existing);
        await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: mcpServerService.deleteMcpServerConfig - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Rotate (regenerate) the token
 */
const refreshMcpToken = async (chatflowId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: { id: chatflowId, workspaceId }
        });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const existing = parseMcpConfig(chatflow);
        if (!existing) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `MCP server config not found for ID: ${chatflowId}`);
        }
        existing.token = generateToken();
        chatflow.mcpServerConfig = JSON.stringify(existing);
        await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
        return existing;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: mcpServerService.refreshMcpToken - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Look up a chatflow by ID and verify the MCP token (constant-time comparison).
 */
const getChatflowByIdAndVerifyToken = async (chatflowId, token) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: { id: chatflowId }
        });
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'MCP server not found');
        }
        const config = parseMcpConfig(chatflow);
        if (!config || !config.enabled || !config.token) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'MCP server not found');
        }
        // Constant-time comparison to prevent timing attacks
        const storedBuffer = Buffer.from(config.token, 'utf8');
        const providedBuffer = Buffer.from(token, 'utf8');
        if (storedBuffer.length !== providedBuffer.length || !crypto_1.default.timingSafeEqual(storedBuffer, providedBuffer)) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid token');
        }
        return chatflow;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: mcpServerService.getChatflowByIdAndVerifyToken - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getMcpServerConfig,
    createMcpServerConfig,
    updateMcpServerConfig,
    deleteMcpServerConfig,
    refreshMcpToken,
    getChatflowByIdAndVerifyToken,
    parseMcpConfig
};
//# sourceMappingURL=index.js.map