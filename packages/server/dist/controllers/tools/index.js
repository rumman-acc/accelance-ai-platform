"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const tools_1 = __importDefault(require("../../services/tools"));
const pagination_1 = require("../../utils/pagination");
const createTool = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.createTool - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: toolsController.createTool - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: toolsController.createTool - workspace ${workspaceId} not found!`);
        }
        const body = req.body;
        // Explicit allowlist — id/workspaceId/timestamps must not be overrideable by client
        const toolBody = {};
        if (body.name !== undefined)
            toolBody.name = body.name;
        if (body.description !== undefined)
            toolBody.description = body.description;
        if (body.color !== undefined)
            toolBody.color = body.color;
        if (body.iconSrc !== undefined)
            toolBody.iconSrc = body.iconSrc;
        if (body.schema !== undefined)
            toolBody.schema = body.schema;
        if (body.func !== undefined)
            toolBody.func = body.func;
        toolBody.workspaceId = workspaceId;
        const apiResponse = await tools_1.default.createTool(toolBody, orgId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteTool = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.deleteTool - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: toolsController.deleteTool - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await tools_1.default.deleteTool(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllTools = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const apiResponse = await tools_1.default.getAllTools(req.user?.activeWorkspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getToolById = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.getToolById - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: toolsController.getToolById - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await tools_1.default.getToolById(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateTool = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.updateTool - id not provided!`);
        }
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.deleteTool - body not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: toolsController.updateTool - workspace ${workspaceId} not found!`);
        }
        const body = req.body;
        // Explicit allowlist — id/workspaceId/timestamps must not be overrideable by client
        const toolBody = {};
        if (body.name !== undefined)
            toolBody.name = body.name;
        if (body.description !== undefined)
            toolBody.description = body.description;
        if (body.color !== undefined)
            toolBody.color = body.color;
        if (body.iconSrc !== undefined)
            toolBody.iconSrc = body.iconSrc;
        if (body.schema !== undefined)
            toolBody.schema = body.schema;
        if (body.func !== undefined)
            toolBody.func = body.func;
        const apiResponse = await tools_1.default.updateTool(req.params.id, toolBody, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createTool,
    deleteTool,
    getAllTools,
    getToolById,
    updateTool
};
//# sourceMappingURL=index.js.map