"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const lodash_1 = require("lodash");
const Credential_1 = require("../../database/entities/Credential");
const EnterpriseEntities_1 = require("../../enterprise/database/entities/EnterpriseEntities");
const workspace_service_1 = require("../../enterprise/services/workspace.service");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const utils_2 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const createCredential = async (requestBody) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const newCredential = await (0, utils_2.transformToCredentialEntity)(requestBody);
        if (requestBody.id) {
            newCredential.id = requestBody.id;
        }
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).create(newCredential);
        const dbResponse = await appServer.AppDataSource.getRepository(Credential_1.Credential).save(credential);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.createCredential - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Delete all credentials from chatflowid
const deleteCredentials = async (credentialId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Credential_1.Credential).delete({ id: credentialId, workspaceId: workspaceId });
        if (!dbResponse) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.deleteCredential - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllCredentials = async (paramCredentialName, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let dbResponse = [];
        if (paramCredentialName) {
            if (Array.isArray(paramCredentialName)) {
                for (let i = 0; i < paramCredentialName.length; i += 1) {
                    const name = paramCredentialName[i];
                    const searchOptions = {
                        credentialName: name,
                        ...(0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId)
                    };
                    const credentials = await appServer.AppDataSource.getRepository(Credential_1.Credential).findBy(searchOptions);
                    dbResponse.push(...credentials.map((c) => (0, lodash_1.omit)(c, ['encryptedData'])));
                }
            }
            else {
                const searchOptions = {
                    credentialName: paramCredentialName,
                    ...(0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId)
                };
                const credentials = await appServer.AppDataSource.getRepository(Credential_1.Credential).findBy(searchOptions);
                dbResponse = credentials.map((c) => (0, lodash_1.omit)(c, ['encryptedData']));
            }
            // get shared credentials
            if (workspaceId) {
                const workspaceService = new workspace_service_1.WorkspaceService();
                const sharedItems = (await workspaceService.getSharedItemsForWorkspace(workspaceId, 'credential'));
                if (sharedItems.length) {
                    for (const sharedItem of sharedItems) {
                        // Check if paramCredentialName is array
                        if (Array.isArray(paramCredentialName)) {
                            for (let i = 0; i < paramCredentialName.length; i += 1) {
                                const name = paramCredentialName[i];
                                if (sharedItem.credentialName === name) {
                                    // @ts-ignore
                                    sharedItem.shared = true;
                                    dbResponse.push((0, lodash_1.omit)(sharedItem, ['encryptedData']));
                                }
                            }
                        }
                        else {
                            if (sharedItem.credentialName === paramCredentialName) {
                                // @ts-ignore
                                sharedItem.shared = true;
                                dbResponse.push((0, lodash_1.omit)(sharedItem, ['encryptedData']));
                            }
                        }
                    }
                }
            }
        }
        else {
            const credentials = await appServer.AppDataSource.getRepository(Credential_1.Credential).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
            for (const credential of credentials) {
                dbResponse.push((0, lodash_1.omit)(credential, ['encryptedData']));
            }
            // get shared credentials
            if (workspaceId) {
                const workspaceService = new workspace_service_1.WorkspaceService();
                const sharedItems = (await workspaceService.getSharedItemsForWorkspace(workspaceId, 'credential'));
                if (sharedItems.length) {
                    for (const sharedItem of sharedItems) {
                        // @ts-ignore
                        sharedItem.shared = true;
                        dbResponse.push((0, lodash_1.omit)(sharedItem, ['encryptedData']));
                    }
                }
            }
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.getAllCredentials - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getCredentialById = async (credentialId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId,
            workspaceId: workspaceId
        });
        if (!credential) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`);
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData, credential.credentialName, appServer.nodesPool.componentCredentials);
        const returnCredential = {
            ...credential,
            plainDataObj: decryptedCredentialData
        };
        const dbResponse = (0, lodash_1.omit)(returnCredential, ['encryptedData']);
        if (workspaceId) {
            const shared = await appServer.AppDataSource.getRepository(EnterpriseEntities_1.WorkspaceShared).count({
                where: {
                    workspaceId: workspaceId,
                    sharedItemId: credentialId,
                    itemType: 'credential'
                }
            });
            if (shared > 0) {
                dbResponse.shared = true;
            }
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.createCredential - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateCredential = async (credentialId, requestBody, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId,
            workspaceId: workspaceId
        });
        if (!credential) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`);
        }
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const incomingData = requestBody.plainDataObj ?? {};
        requestBody.plainDataObj = { ...decryptedCredentialData, ...incomingData };
        const updateCredential = await (0, utils_2.transformToCredentialEntity)(requestBody);
        updateCredential.workspaceId = workspaceId;
        await appServer.AppDataSource.getRepository(Credential_1.Credential).merge(credential, updateCredential);
        const dbResponse = await appServer.AppDataSource.getRepository(Credential_1.Credential).save(credential);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.updateCredential - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const revealCredentialById = async (credentialId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
            id: credentialId,
            workspaceId: workspaceId
        });
        if (!credential) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`);
        }
        const decryptedCredentialData = await (0, utils_2.decryptCredentialData)(credential.encryptedData);
        const componentCredentials = appServer.nodesPool.componentCredentials;
        const inputs = componentCredentials[credential.credentialName]?.inputs ?? [];
        const plainDataObj = { ...decryptedCredentialData };
        for (const key in plainDataObj) {
            const inputParam = inputs.find((inp) => inp.name === key);
            if (inputParam?.type !== 'url') {
                plainDataObj[key] = utils_2.REDACTED_CREDENTIAL_VALUE;
            }
        }
        return { plainDataObj };
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.revealCredentialById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createCredential,
    deleteCredentials,
    getAllCredentials,
    getCredentialById,
    revealCredentialById,
    updateCredential
};
//# sourceMappingURL=index.js.map