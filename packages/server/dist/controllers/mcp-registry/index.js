"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const mcp_registry_1 = __importDefault(require("../../services/mcp-registry"));
const requireWorkspaceId = (req) => {
    const workspaceId = req.user?.activeWorkspaceId;
    if (!workspaceId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: mcpRegistryController - workspace not found!`);
    }
    return workspaceId;
};
const searchServers = async (req, res, next) => {
    try {
        const query = req.query.query || '';
        const cursor = req.query.cursor;
        const apiResponse = await mcp_registry_1.default.searchServers(query, cursor);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const importServer = async (req, res, next) => {
    try {
        const workspaceId = requireWorkspaceId(req);
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: mcpRegistryController.importServer - organization not found!`);
        }
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: mcpRegistryController.importServer - body not provided!`);
        }
        const { registryId, transport, headerValues, envValues } = req.body;
        if (!registryId || (transport !== 'remote' && transport !== 'stdio')) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: mcpRegistryController.importServer - registryId and a valid transport ("remote"|"stdio") are required!`);
        }
        const apiResponse = await mcp_registry_1.default.importServer(workspaceId, orgId, registryId, transport, headerValues, envValues);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    searchServers,
    importServer
};
//# sourceMappingURL=index.js.map