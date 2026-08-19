"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const Variable_1 = require("../../database/entities/Variable");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const utils_2 = require("../../utils");
const uuid_1 = require("uuid");
const Interface_1 = require("../../Interface");
const createVariable = async (newVariable, orgId) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    if (appServer.identityManager.getPlatformType() === Interface_1.Platform.CLOUD && newVariable.type === 'runtime')
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cloud platform does not support runtime variables!');
    try {
        const variable = await appServer.AppDataSource.getRepository(Variable_1.Variable).create(newVariable);
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).save(variable);
        await appServer.telemetry.sendTelemetry('variable_created', {
            version: await (0, utils_2.getAppVersion)(),
            variableType: variable.type
        }, orgId);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.createVariable - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteVariable = async (variableId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).delete({ id: variableId, workspaceId: workspaceId });
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.deleteVariable - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllVariables = async (workspaceId, page = -1, limit = -1) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const queryBuilder = appServer.AppDataSource.getRepository(Variable_1.Variable)
            .createQueryBuilder('variable')
            .orderBy('variable.updatedDate', 'DESC');
        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);
        }
        if (workspaceId)
            queryBuilder.andWhere('variable.workspaceId = :workspaceId', { workspaceId });
        if (appServer.identityManager.getPlatformType() === Interface_1.Platform.CLOUD) {
            queryBuilder.andWhere('variable.type != :type', { type: 'runtime' });
        }
        const [data, total] = await queryBuilder.getManyAndCount();
        if (page > 0 && limit > 0) {
            return { data, total };
        }
        else {
            return data;
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.getAllVariables - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getVariableById = async (variableId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).findOneBy({
            id: variableId,
            workspaceId: workspaceId
        });
        if (appServer.identityManager.getPlatformType() === Interface_1.Platform.CLOUD && dbResponse?.type === 'runtime') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Cloud platform does not support runtime variables!');
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.getVariableById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateVariable = async (variable, updatedVariable) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    if (appServer.identityManager.getPlatformType() === Interface_1.Platform.CLOUD && updatedVariable.type === 'runtime')
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cloud platform does not support runtime variables!');
    try {
        const originalWorkspaceId = variable.workspaceId;
        const tmpUpdatedVariable = await appServer.AppDataSource.getRepository(Variable_1.Variable).merge(variable, updatedVariable);
        tmpUpdatedVariable.workspaceId = originalWorkspaceId;
        const dbResponse = await appServer.AppDataSource.getRepository(Variable_1.Variable).save(tmpUpdatedVariable);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variablesServices.updateVariable - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const importVariables = async (newVariables, queryRunner) => {
    try {
        for (const data of newVariables) {
            if (data.id && !(0, uuid_1.validate)(data.id)) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: importVariables - invalid id!`);
            }
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repository = queryRunner ? queryRunner.manager.getRepository(Variable_1.Variable) : appServer.AppDataSource.getRepository(Variable_1.Variable);
        // step 1 - check whether array is zero
        if (newVariables.length == 0)
            return;
        // step 2 - check whether ids are duplicate in database
        let ids = '(';
        let count = 0;
        const lastCount = newVariables.length - 1;
        newVariables.forEach((newVariable) => {
            ids += `'${newVariable.id}'`;
            if (lastCount != count)
                ids += ',';
            if (lastCount == count)
                ids += ')';
            count += 1;
        });
        const selectResponse = await repository.createQueryBuilder('v').select('v.id').where(`v.id IN ${ids}`).getMany();
        const foundIds = selectResponse.map((response) => {
            return response.id;
        });
        // step 3 - remove ids that are only duplicate
        let prepVariables = newVariables.map((newVariable) => {
            let id = '';
            if (newVariable.id)
                id = newVariable.id;
            if (foundIds.includes(id)) {
                newVariable.id = undefined;
                newVariable.name += ' (1)';
            }
            return newVariable;
        });
        // Filter out variables with type "runtime"
        if (appServer.identityManager.getPlatformType() === Interface_1.Platform.CLOUD)
            prepVariables = prepVariables.filter((variable) => variable.type !== 'runtime');
        // step 4 - transactional insert array of entities
        const insertResponse = await repository.insert(prepVariables);
        return insertResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: variableService.importVariables - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createVariable,
    deleteVariable,
    getAllVariables,
    getVariableById,
    updateVariable,
    importVariables
};
//# sourceMappingURL=index.js.map