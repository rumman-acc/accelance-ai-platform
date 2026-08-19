"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const variables_1 = __importDefault(require("../../services/variables"));
const Variable_1 = require("../../database/entities/Variable");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const pagination_1 = require("../../utils/pagination");
const createVariable = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: variablesController.createVariable - body not provided!`);
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
        const newVariable = new Variable_1.Variable();
        if (body.name !== undefined)
            newVariable.name = body.name;
        if (body.value !== undefined)
            newVariable.value = body.value;
        if (body.type !== undefined)
            newVariable.type = body.type;
        newVariable.workspaceId = workspaceId;
        const apiResponse = await variables_1.default.createVariable(newVariable, orgId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteVariable = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: variablesController.deleteVariable - id not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: variablesController.deleteVariable - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await variables_1.default.deleteVariable(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllVariables = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: variablesController.getAllVariables - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await variables_1.default.getAllVariables(workspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateVariable = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: variablesController.updateVariable - id not provided!');
        }
        if (typeof req.body === 'undefined') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Error: variablesController.updateVariable - body not provided!');
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: variablesController.updateVariable - workspace ${workspaceId} not found!`);
        }
        const variable = await variables_1.default.getVariableById(req.params.id, workspaceId);
        if (!variable) {
            return res.status(404).send('Variable not found in the database');
        }
        const body = req.body;
        // Explicit allowlist — id/workspaceId/timestamps must not be overrideable by client
        const updatedVariable = new Variable_1.Variable();
        if (body.name !== undefined)
            updatedVariable.name = body.name;
        if (body.value !== undefined)
            updatedVariable.value = body.value;
        if (body.type !== undefined)
            updatedVariable.type = body.type;
        const apiResponse = await variables_1.default.updateVariable(variable, updatedVariable);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createVariable,
    deleteVariable,
    getAllVariables,
    updateVariable
};
//# sourceMappingURL=index.js.map