"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const evaluations_1 = __importDefault(require("../../services/evaluations"));
const pagination_1 = require("../../utils/pagination");
const createEvaluation = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluationsService.createEvaluation - body not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.createEvaluation - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.createEvaluation - workspace ${workspaceId} not found!`);
        }
        const body = req.body;
        body.workspaceId = workspaceId;
        const baseURL = `${process.env.APP_URL}`;
        const apiResponse = await evaluations_1.default.createEvaluation(body, baseURL, orgId, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const runAgain = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluationsService.runAgain - id not provided!`);
        }
        const orgId = req.user?.activeOrganizationId;
        if (!orgId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.runAgain - organization ${orgId} not found!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.runAgain - workspace ${workspaceId} not found!`);
        }
        const baseURL = `${process.env.APP_URL}`;
        const apiResponse = await evaluations_1.default.runAgain(req.params.id, baseURL, orgId, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getEvaluation = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluationsService.getEvaluation - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.getEvaluation - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluations_1.default.getEvaluation(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteEvaluation = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluationsService.deleteEvaluation - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.deleteEvaluation - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluations_1.default.deleteEvaluation(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllEvaluations = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.getAllEvaluations - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluations_1.default.getAllEvaluations(workspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const isOutdated = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluationsService.isOutdated - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.isOutdated - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluations_1.default.isOutdated(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getVersions = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: evaluationsService.getVersions - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.getVersions - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluations_1.default.getVersions(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const patchDeleteEvaluations = async (req, res, next) => {
    try {
        const ids = req.body.ids ?? [];
        const isDeleteAllVersion = req.body.isDeleteAllVersion ?? false;
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: evaluationsService.patchDeleteEvaluations - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await evaluations_1.default.patchDeleteEvaluations(ids, workspaceId, isDeleteAllVersion);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createEvaluation,
    getEvaluation,
    deleteEvaluation,
    getAllEvaluations,
    isOutdated,
    runAgain,
    getVersions,
    patchDeleteEvaluations
};
//# sourceMappingURL=index.js.map