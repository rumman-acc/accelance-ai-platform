"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const mcp_server_1 = __importDefault(require("../../services/mcp-server"));
const getMcpServerConfig = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: mcpServerController.getMcpServerConfig - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: mcpServerController.getMcpServerConfig - workspace not found!');
        }
        const apiResponse = await mcp_server_1.default.getMcpServerConfig(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createMcpServerConfig = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: mcpServerController.createMcpServerConfig - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: mcpServerController.createMcpServerConfig - workspace not found!');
        }
        const apiResponse = await mcp_server_1.default.createMcpServerConfig(req.params.id, workspaceId, req.body || {});
        return res.status(http_status_codes_1.StatusCodes.CREATED).json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateMcpServerConfig = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: mcpServerController.updateMcpServerConfig - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: mcpServerController.updateMcpServerConfig - workspace not found!');
        }
        const apiResponse = await mcp_server_1.default.updateMcpServerConfig(req.params.id, workspaceId, req.body || {});
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteMcpServerConfig = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: mcpServerController.deleteMcpServerConfig - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: mcpServerController.deleteMcpServerConfig - workspace not found!');
        }
        await mcp_server_1.default.deleteMcpServerConfig(req.params.id, workspaceId);
        return res.json({ message: 'MCP server config disabled' });
    }
    catch (error) {
        next(error);
    }
};
const refreshMcpToken = async (req, res, next) => {
    try {
        if (!req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: mcpServerController.refreshMcpToken - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: mcpServerController.refreshMcpToken - workspace not found!');
        }
        const apiResponse = await mcp_server_1.default.refreshMcpToken(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getMcpServerConfig,
    createMcpServerConfig,
    updateMcpServerConfig,
    deleteMcpServerConfig,
    refreshMcpToken
};
//# sourceMappingURL=index.js.map