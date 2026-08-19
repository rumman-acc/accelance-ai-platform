"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const nodes_1 = __importDefault(require("../../services/nodes"));
const accelance_components_1 = require("accelance-components");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
// if req.query.client does not contain a valid client type, then return undefined so it won't filter the nodes unnecessarily
const parseClientParam = (req) => {
    const raw = req.query.client;
    return raw && accelance_components_1.VALID_CLIENT_TYPES.has(raw) ? raw : undefined;
};
const getAllNodes = async (req, res, next) => {
    try {
        const apiResponse = await nodes_1.default.getAllNodes(parseClientParam(req));
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getNodeByName = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.name) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: nodesController.getNodeByName - name not provided!`);
        }
        const apiResponse = await nodes_1.default.getNodeByName(req.params.name, parseClientParam(req));
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getNodesByCategory = async (req, res, next) => {
    try {
        if (typeof req.params.name === 'undefined' || req.params.name === '') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: nodesController.getNodesByCategory - name not provided!`);
        }
        const name = lodash_1.default.unescape(req.params.name);
        const apiResponse = await nodes_1.default.getAllNodesForCategory(name, parseClientParam(req));
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getSingleNodeIcon = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.name) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: nodesController.getSingleNodeIcon - name not provided!`);
        }
        const apiResponse = await nodes_1.default.getSingleNodeIcon(req.params.name);
        return res.sendFile(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getSingleNodeAsyncOptions = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: nodesController.getSingleNodeAsyncOptions - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.name) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: nodesController.getSingleNodeAsyncOptions - name not provided!`);
        }
        const body = req.body;
        body.searchOptions = (0, ControllerServiceUtils_1.getWorkspaceSearchOptionsFromReq)(req);
        const apiResponse = await nodes_1.default.getSingleNodeAsyncOptions(req.params.name, body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const executeCustomFunction = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: nodesController.executeCustomFunction - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        const workspaceId = req.user?.activeWorkspaceId;
        const canViewVariables = !!(req.user?.isOrganizationAdmin || req.user?.permissions?.includes('variables:view'));
        const apiResponse = await nodes_1.default.executeCustomFunction(req.body, workspaceId, orgId, canViewVariables);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllNodes,
    getNodeByName,
    getSingleNodeIcon,
    getSingleNodeAsyncOptions,
    executeCustomFunction,
    getNodesByCategory
};
//# sourceMappingURL=index.js.map