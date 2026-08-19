"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const evaluator_1 = __importDefault(require("../../services/evaluator"));
const pagination_1 = require("../../utils/pagination");
const getAllEvaluators = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluatorService.getAllEvaluators - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluator_1.default.getAllEvaluators(workspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getEvaluator = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluatorService.getEvaluator - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluatorService.getEvaluator - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluator_1.default.getEvaluator(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createEvaluator = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluatorService.createEvaluator - body not provided!`);
        }
        const body = req.body;
        body.workspaceId = req.user?.activeWorkspaceId;
        const apiResponse = await evaluator_1.default.createEvaluator(body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateEvaluator = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluatorService.updateEvaluator - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluatorService.updateEvaluator - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluatorService.updateEvaluator - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluator_1.default.updateEvaluator(req.params.id, req.body, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteEvaluator = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluatorService.deleteEvaluator - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluatorService.deleteEvaluator - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluator_1.default.deleteEvaluator(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllEvaluators,
    getEvaluator,
    createEvaluator,
    updateEvaluator,
    deleteEvaluator
};
//# sourceMappingURL=index.js.map