"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const Interface_1 = require("../../Interface");
const custom_mcp_servers_1 = __importDefault(require("../../services/custom-mcp-servers"));
const pagination_1 = require("../../utils/pagination");
const MAX_PAGE_LIMIT = 500;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const assertValidAuthType = (authType, endpoint) => {
    if (authType === undefined)
        return;
    const allowed = Object.values(Interface_1.CustomMcpServerAuthType);
    if (typeof authType !== 'string' || !allowed.includes(authType)) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: customMcpServersController.${endpoint} - invalid authType "${String(authType)}"`);
    }
};
const createCustomMcpServer = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: customMcpServersController.createCustomMcpServer - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: customMcpServersController.createCustomMcpServer - organization not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: customMcpServersController.createCustomMcpServer - workspace not found!`);
        }
        const body = req.body;
        assertValidAuthType(body.authType, 'createCustomMcpServer');
        // Explicit allowlist — id/workspaceId/timestamps must not be overrideable by client
        const mcpBody = {};
        if (body.name !== undefined)
            mcpBody.name = body.name;
        if (body.serverUrl !== undefined)
            mcpBody.serverUrl = body.serverUrl;
        if (body.iconSrc !== undefined)
            mcpBody.iconSrc = body.iconSrc;
        if (body.color !== undefined)
            mcpBody.color = body.color;
        if (body.authType !== undefined)
            mcpBody.authType = body.authType;
        if (body.authConfig !== undefined)
            mcpBody.authConfig = body.authConfig;
        if (body.transportType !== undefined)
            mcpBody.transportType = body.transportType;
        if (body.command !== undefined)
            mcpBody.command = body.command;
        if (body.args !== undefined)
            mcpBody.args = body.args;
        if (body.env !== undefined)
            mcpBody.env = body.env;
        mcpBody.workspaceId = workspaceId;
        const apiResponse = await custom_mcp_servers_1.default.createCustomMcpServer(mcpBody, orgId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllCustomMcpServers = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: customMcpServersController.getAllCustomMcpServers - workspace not found!`);
        }
        const raw = (0, pagination_1.getPageAndLimitParams)(req);
        const page = raw.page > 0 ? raw.page : DEFAULT_PAGE;
        const limit = raw.limit > 0 ? Math.min(raw.limit, MAX_PAGE_LIMIT) : DEFAULT_LIMIT;
        const apiResponse = await custom_mcp_servers_1.default.getAllCustomMcpServers(workspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getCustomMcpServerById = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: customMcpServersController.getCustomMcpServerById - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: customMcpServersController.getCustomMcpServerById - workspace not found!`);
        }
        const apiResponse = await custom_mcp_servers_1.default.getCustomMcpServerById(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateCustomMcpServer = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: customMcpServersController.updateCustomMcpServer - id not provided!`);
        }
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: customMcpServersController.updateCustomMcpServer - body not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: customMcpServersController.updateCustomMcpServer - workspace not found!`);
        }
        const body = req.body;
        assertValidAuthType(body.authType, 'updateCustomMcpServer');
        // Explicit allowlist
        const mcpBody = {};
        if (body.name !== undefined)
            mcpBody.name = body.name;
        if (body.serverUrl !== undefined)
            mcpBody.serverUrl = body.serverUrl;
        if (body.iconSrc !== undefined)
            mcpBody.iconSrc = body.iconSrc;
        if (body.color !== undefined)
            mcpBody.color = body.color;
        if (body.authType !== undefined)
            mcpBody.authType = body.authType;
        if (body.authConfig !== undefined)
            mcpBody.authConfig = body.authConfig;
        const apiResponse = await custom_mcp_servers_1.default.updateCustomMcpServer(req.params.id, mcpBody, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteCustomMcpServer = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: customMcpServersController.deleteCustomMcpServer - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: customMcpServersController.deleteCustomMcpServer - workspace not found!`);
        }
        const apiResponse = await custom_mcp_servers_1.default.deleteCustomMcpServer(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const authorizeCustomMcpServer = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: customMcpServersController.authorizeCustomMcpServer - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: customMcpServersController.authorizeCustomMcpServer - workspace not found!`);
        }
        const apiResponse = await custom_mcp_servers_1.default.authorizeCustomMcpServer(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getDiscoveredTools = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: customMcpServersController.getDiscoveredTools - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: customMcpServersController.getDiscoveredTools - workspace not found!`);
        }
        const apiResponse = await custom_mcp_servers_1.default.getDiscoveredTools(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createCustomMcpServer,
    getAllCustomMcpServers,
    getCustomMcpServerById,
    updateCustomMcpServer,
    deleteCustomMcpServer,
    authorizeCustomMcpServer,
    getDiscoveredTools
};
//# sourceMappingURL=index.js.map