"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const Evaluator_1 = require("../../database/entities/Evaluator");
const Interface_Evaluation_1 = require("../../Interface.Evaluation");
const getAllEvaluators = async (workspaceId, page = -1, limit = -1) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const queryBuilder = appServer.AppDataSource.getRepository(Evaluator_1.Evaluator).createQueryBuilder('ev').orderBy('ev.updatedDate', 'DESC');
        queryBuilder.andWhere('ev.workspaceId = :workspaceId', { workspaceId });
        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);
        }
        const [data, total] = await queryBuilder.getManyAndCount();
        if (page > 0 && limit > 0) {
            return {
                total,
                data: Interface_Evaluation_1.EvaluatorDTO.fromEntities(data)
            };
        }
        else {
            return Interface_Evaluation_1.EvaluatorDTO.fromEntities(data);
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: evaluatorService.getAllEvaluators - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getEvaluator = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const evaluator = await appServer.AppDataSource.getRepository(Evaluator_1.Evaluator).findOneBy({
            id: id,
            workspaceId: workspaceId
        });
        if (!evaluator)
            throw new Error(`Evaluator ${id} not found`);
        return Interface_Evaluation_1.EvaluatorDTO.fromEntity(evaluator);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: evaluatorService.getEvaluator - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Create new Evaluator
const createEvaluator = async (body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const newDs = Interface_Evaluation_1.EvaluatorDTO.toEntity(body);
        newDs.workspaceId = body.workspaceId;
        const evaluator = appServer.AppDataSource.getRepository(Evaluator_1.Evaluator).create(newDs);
        const result = await appServer.AppDataSource.getRepository(Evaluator_1.Evaluator).save(evaluator);
        return Interface_Evaluation_1.EvaluatorDTO.fromEntity(result);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: evaluatorService.createEvaluator - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Update Evaluator
const updateEvaluator = async (id, body, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const evaluator = await appServer.AppDataSource.getRepository(Evaluator_1.Evaluator).findOneBy({
            id: id,
            workspaceId: workspaceId
        });
        if (!evaluator)
            throw new Error(`Evaluator ${id} not found`);
        const updateEvaluator = Interface_Evaluation_1.EvaluatorDTO.toEntity(body);
        updateEvaluator.id = id;
        updateEvaluator.workspaceId = workspaceId;
        appServer.AppDataSource.getRepository(Evaluator_1.Evaluator).merge(evaluator, updateEvaluator);
        const result = await appServer.AppDataSource.getRepository(Evaluator_1.Evaluator).save(evaluator);
        return Interface_Evaluation_1.EvaluatorDTO.fromEntity(result);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: evaluatorService.updateEvaluator - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Delete Evaluator via id
const deleteEvaluator = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        return await appServer.AppDataSource.getRepository(Evaluator_1.Evaluator).delete({ id: id, workspaceId: workspaceId });
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: evaluatorService.deleteEvaluator - ${(0, utils_1.getErrorMessage)(error)}`);
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