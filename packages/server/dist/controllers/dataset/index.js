"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const dataset_1 = __importDefault(require("../../services/dataset"));
const http_status_codes_1 = require("http-status-codes");
const pagination_1 = require("../../utils/pagination");
const stripProtectedFields_1 = require("../../utils/stripProtectedFields");
const getAllDatasets = async (req, res, next) => {
    try {
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.getAllDatasets - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await dataset_1.default.getAllDatasets(workspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getDataset = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.getDataset - id not provided!`);
        }
        const { page, limit } = (0, pagination_1.getPageAndLimitParams)(req);
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.getDataset - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await dataset_1.default.getDataset(req.params.id, workspaceId, page, limit);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const createDataset = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.createDataset - body not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.createDataset - workspace ${workspaceId} not found!`);
        }
        const body = { ...(0, stripProtectedFields_1.stripProtectedFields)(req.body), workspaceId };
        const apiResponse = await dataset_1.default.createDataset(body, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateDataset = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.updateDataset - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.updateDataset - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.updateDataset - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await dataset_1.default.updateDataset(req.params.id, (0, stripProtectedFields_1.stripProtectedFields)(req.body), workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteDataset = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.deleteDataset - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.deleteDataset - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await dataset_1.default.deleteDataset(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const addDatasetRow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.addDatasetRow - body not provided!`);
        }
        if (!req.body.datasetId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.addDatasetRow - datasetId not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.addDatasetRow - workspace ${workspaceId} not found!`);
        }
        const body = { ...(0, stripProtectedFields_1.stripProtectedFields)(req.body), workspaceId };
        const apiResponse = await dataset_1.default.addDatasetRow(body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateDatasetRow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.updateDatasetRow - body not provided!`);
        }
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.updateDatasetRow - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.updateDatasetRow - workspace ${workspaceId} not found!`);
        }
        const body = { ...(0, stripProtectedFields_1.stripProtectedFields)(req.body), workspaceId };
        const apiResponse = await dataset_1.default.updateDatasetRow(req.params.id, body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteDatasetRow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.deleteDatasetRow - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.deleteDatasetRow - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await dataset_1.default.deleteDatasetRow(req.params.id, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const patchDeleteRows = async (req, res, next) => {
    try {
        const ids = req.body.ids ?? [];
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.patchDeleteRows - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await dataset_1.default.patchDeleteRows(ids, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const reorderDatasetRow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: datasetService.reorderDatasetRow - body not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        if (!workspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: datasetController.reorderDatasetRow - workspace ${workspaceId} not found!`);
        }
        const apiResponse = await dataset_1.default.reorderDatasetRow(req.body.datasetId, req.body.rows, workspaceId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getAllDatasets,
    getDataset,
    createDataset,
    updateDataset,
    deleteDataset,
    addDatasetRow,
    updateDatasetRow,
    deleteDatasetRow,
    patchDeleteRows,
    reorderDatasetRow
};
//# sourceMappingURL=index.js.map