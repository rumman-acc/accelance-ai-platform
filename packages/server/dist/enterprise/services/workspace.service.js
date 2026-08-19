"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceService = void 0;
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const ApiKey_1 = require("../../database/entities/ApiKey");
const guardrails_1 = __importDefault(require("../../services/guardrails"));
const Assistant_1 = require("../../database/entities/Assistant");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
const Credential_1 = require("../../database/entities/Credential");
const CustomTemplate_1 = require("../../database/entities/CustomTemplate");
const Dataset_1 = require("../../database/entities/Dataset");
const DatasetRow_1 = require("../../database/entities/DatasetRow");
const DocumentStore_1 = require("../../database/entities/DocumentStore");
const DocumentStoreFileChunk_1 = require("../../database/entities/DocumentStoreFileChunk");
const Evaluation_1 = require("../../database/entities/Evaluation");
const EvaluationRun_1 = require("../../database/entities/EvaluationRun");
const Evaluator_1 = require("../../database/entities/Evaluator");
const Execution_1 = require("../../database/entities/Execution");
const Tool_1 = require("../../database/entities/Tool");
const UpsertHistory_1 = require("../../database/entities/UpsertHistory");
const Variable_1 = require("../../database/entities/Variable");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const EnterpriseEntities_1 = require("../database/entities/EnterpriseEntities");
const role_entity_1 = require("../database/entities/role.entity");
const workspace_user_entity_1 = require("../database/entities/workspace-user.entity");
const workspace_entity_1 = require("../database/entities/workspace.entity");
const validation_util_1 = require("../utils/validation.util");
const organization_service_1 = require("./organization.service");
const role_service_1 = require("./role.service");
const user_service_1 = require("./user.service");
class WorkspaceService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.userService = new user_service_1.UserService();
        this.organizationService = new organization_service_1.OrganizationService();
        this.roleService = new role_service_1.RoleService();
    }
    validateWorkspaceId(id) {
        if ((0, validation_util_1.isInvalidUUID)(id))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Workspace Id" /* WorkspaceErrorMessage.INVALID_WORKSPACE_ID */);
    }
    async readWorkspaceById(id, queryRunner) {
        this.validateWorkspaceId(id);
        return await queryRunner.manager.findOneBy(workspace_entity_1.Workspace, { id });
    }
    validateWorkspaceName(name, isRegister = false) {
        if ((0, validation_util_1.isInvalidName)(name))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Workspace Name" /* WorkspaceErrorMessage.INVALID_WORKSPACE_NAME */);
        if (!isRegister && (name === workspace_entity_1.WorkspaceName.DEFAULT_PERSONAL_WORKSPACE || name === workspace_entity_1.WorkspaceName.DEFAULT_WORKSPACE)) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workspace name cannot be Default Workspace or Personal Workspace - this is a reserved name" /* WorkspaceErrorMessage.WORKSPACE_RESERVERD_NAME */);
        }
    }
    async readWorkspaceByOrganizationId(organizationId, queryRunner) {
        await this.organizationService.readOrganizationById(organizationId, queryRunner);
        const workspaces = await queryRunner.manager.findBy(workspace_entity_1.Workspace, { organizationId });
        const rolePersonalWorkspace = await this.roleService.readGeneralRoleByName(role_entity_1.GeneralRole.PERSONAL_WORKSPACE, queryRunner);
        if (!rolePersonalWorkspace)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Role Not Found" /* RoleErrorMessage.ROLE_NOT_FOUND */);
        const filteredWorkspaces = await Promise.all(workspaces.map(async (workspace) => {
            const workspaceUsers = await queryRunner.manager.findBy(workspace_user_entity_1.WorkspaceUser, { workspaceId: workspace.id });
            // Skip if any user in the workspace has PERSONAL_WORKSPACE role
            const hasPersonalWorkspaceUser = workspaceUsers.some((user) => user.roleId === rolePersonalWorkspace.id);
            if (hasPersonalWorkspaceUser) {
                return null;
            }
            return {
                ...workspace,
                userCount: workspaceUsers.length
            };
        }));
        // Filter out null values (personal workspaces)
        return filteredWorkspaces.filter((workspace) => workspace !== null);
    }
    createNewWorkspace(data, queryRunner, isRegister = false) {
        this.validateWorkspaceName(data.name, isRegister);
        data.updatedBy = data.createdBy;
        data.id = (0, utils_1.generateId)();
        return queryRunner.manager.create(workspace_entity_1.Workspace, data);
    }
    async saveWorkspace(data, queryRunner) {
        return await queryRunner.manager.save(workspace_entity_1.Workspace, data);
    }
    async createWorkspace(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const organization = await this.organizationService.readOrganizationById(data.organizationId, queryRunner);
        if (!organization)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Organization Not Found" /* OrganizationErrorMessage.ORGANIZATION_NOT_FOUND */);
        const user = await this.userService.readUserById(data.createdBy, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        let newWorkspace = this.createNewWorkspace(data, queryRunner);
        try {
            await queryRunner.startTransaction();
            newWorkspace = await this.saveWorkspace(newWorkspace, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        // Policy Templates guardrail: every new workspace starts with the default bundle applied
        // (currently: PII redaction on). Outside the transaction above -- must never roll back
        // workspace creation if this fails; applyDefaultPolicyTemplate already fails safe/logs.
        await guardrails_1.default.applyDefaultPolicyTemplate(newWorkspace.id);
        return newWorkspace;
    }
    async updateWorkspace(newWorkspaceData) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const oldWorkspaceData = await this.readWorkspaceById(newWorkspaceData.id, queryRunner);
        if (!oldWorkspaceData)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace Not Found" /* WorkspaceErrorMessage.WORKSPACE_NOT_FOUND */);
        const user = await this.userService.readUserById(newWorkspaceData.updatedBy, queryRunner);
        if (!user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
        if (newWorkspaceData.name) {
            this.validateWorkspaceName(newWorkspaceData.name);
        }
        newWorkspaceData.organizationId = oldWorkspaceData.organizationId;
        newWorkspaceData.createdBy = oldWorkspaceData.createdBy;
        let updateWorkspace = queryRunner.manager.merge(workspace_entity_1.Workspace, oldWorkspaceData, newWorkspaceData);
        try {
            await queryRunner.startTransaction();
            updateWorkspace = await this.saveWorkspace(updateWorkspace, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return updateWorkspace;
    }
    async deleteWorkspaceById(queryRunner, workspaceId) {
        const workspace = await this.readWorkspaceById(workspaceId, queryRunner);
        if (!workspace)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "Workspace Not Found" /* WorkspaceErrorMessage.WORKSPACE_NOT_FOUND */);
        // First get all related entities that need to be deleted
        const chatflows = await queryRunner.manager.findBy(ChatFlow_1.ChatFlow, { workspaceId });
        const documentStores = await queryRunner.manager.findBy(DocumentStore_1.DocumentStore, { workspaceId });
        const evaluations = await queryRunner.manager.findBy(Evaluation_1.Evaluation, { workspaceId });
        const datasets = await queryRunner.manager.findBy(Dataset_1.Dataset, { workspaceId });
        // Extract IDs for bulk deletion
        const chatflowIds = chatflows.map((cf) => cf.id);
        const documentStoreIds = documentStores.map((ds) => ds.id);
        const evaluationIds = evaluations.map((e) => e.id);
        const datasetIds = datasets.map((d) => d.id);
        // Start deleting in the correct order to maintain referential integrity
        await queryRunner.manager.delete(workspace_user_entity_1.WorkspaceUser, { workspaceId });
        await queryRunner.manager.delete(ApiKey_1.ApiKey, { workspaceId });
        await queryRunner.manager.delete(Assistant_1.Assistant, { workspaceId });
        await queryRunner.manager.delete(Execution_1.Execution, { workspaceId });
        // Delete chatflow related entities
        if (chatflowIds.length > 0) {
            await queryRunner.manager.delete(ChatFlow_1.ChatFlow, { workspaceId });
            await queryRunner.manager.delete(ChatMessageFeedback_1.ChatMessageFeedback, { chatflowid: (0, typeorm_1.In)(chatflowIds) });
            await queryRunner.manager.delete(ChatMessage_1.ChatMessage, { chatflowid: (0, typeorm_1.In)(chatflowIds) });
            await queryRunner.manager.delete(UpsertHistory_1.UpsertHistory, { chatflowid: (0, typeorm_1.In)(chatflowIds) });
        }
        await queryRunner.manager.delete(Credential_1.Credential, { workspaceId });
        await queryRunner.manager.delete(CustomTemplate_1.CustomTemplate, { workspaceId });
        // Delete dataset related entities
        if (datasetIds.length > 0) {
            await queryRunner.manager.delete(Dataset_1.Dataset, { workspaceId });
            await queryRunner.manager.delete(DatasetRow_1.DatasetRow, { datasetId: (0, typeorm_1.In)(datasetIds) });
        }
        // Delete document store related entities
        if (documentStoreIds.length > 0) {
            await queryRunner.manager.delete(DocumentStore_1.DocumentStore, { workspaceId });
            await queryRunner.manager.delete(DocumentStoreFileChunk_1.DocumentStoreFileChunk, { storeId: (0, typeorm_1.In)(documentStoreIds) });
        }
        // Delete evaluation related entities
        if (evaluationIds.length > 0) {
            await queryRunner.manager.delete(Evaluation_1.Evaluation, { workspaceId });
            await queryRunner.manager.delete(EvaluationRun_1.EvaluationRun, { evaluationId: (0, typeorm_1.In)(evaluationIds) });
        }
        await queryRunner.manager.delete(Evaluator_1.Evaluator, { workspaceId });
        await queryRunner.manager.delete(Tool_1.Tool, { workspaceId });
        await queryRunner.manager.delete(Variable_1.Variable, { workspaceId });
        await queryRunner.manager.delete(EnterpriseEntities_1.WorkspaceShared, { workspaceId });
        // Finally delete the workspace itself
        await queryRunner.manager.delete(workspace_entity_1.Workspace, { id: workspaceId });
        return workspace;
    }
    async getSharedWorkspacesForItem(itemId) {
        const sharedWorkspaces = await this.dataSource.getRepository(EnterpriseEntities_1.WorkspaceShared).find({
            where: {
                sharedItemId: itemId
            }
        });
        if (sharedWorkspaces.length === 0) {
            return [];
        }
        const workspaceIds = sharedWorkspaces.map((ws) => ws.workspaceId);
        const workspaces = await this.dataSource.getRepository(workspace_entity_1.Workspace).find({
            select: ['id', 'name'],
            where: { id: (0, typeorm_1.In)(workspaceIds) }
        });
        return sharedWorkspaces.map((sw) => {
            const workspace = workspaces.find((w) => w.id === sw.workspaceId);
            return {
                workspaceId: sw.workspaceId,
                workspaceName: workspace?.name,
                sharedItemId: sw.sharedItemId,
                itemType: sw.itemType
            };
        });
    }
    async getSharedItemsForWorkspace(wsId, itemType) {
        const sharedItems = await this.dataSource.getRepository(EnterpriseEntities_1.WorkspaceShared).find({
            where: {
                workspaceId: wsId,
                itemType: itemType
            }
        });
        if (sharedItems.length === 0) {
            return [];
        }
        const itemIds = sharedItems.map((item) => item.sharedItemId);
        if (itemType === 'credential') {
            return await this.dataSource.getRepository(Credential_1.Credential).find({
                select: ['id', 'name', 'credentialName', 'createdDate', 'updatedDate', 'workspaceId'],
                where: { id: (0, typeorm_1.In)(itemIds) }
            });
        }
        else if (itemType === 'custom_template') {
            return await this.dataSource.getRepository(CustomTemplate_1.CustomTemplate).find({
                where: { id: (0, typeorm_1.In)(itemIds) }
            });
        }
        return [];
    }
    async setSharedWorkspacesForItem(itemId, body) {
        const { itemType, workspaceIds } = body;
        await this.dataSource.transaction(async (transactionalEntityManager) => {
            // Delete existing shared workspaces for the item
            await transactionalEntityManager.getRepository(EnterpriseEntities_1.WorkspaceShared).delete({
                sharedItemId: itemId
            });
            // Add new shared workspaces
            const sharedWorkspaces = workspaceIds.map((workspaceId) => transactionalEntityManager.getRepository(EnterpriseEntities_1.WorkspaceShared).create({
                workspaceId,
                sharedItemId: itemId,
                itemType
            }));
            await transactionalEntityManager.getRepository(EnterpriseEntities_1.WorkspaceShared).save(sharedWorkspaces);
        });
        return { message: "Resource Updated Successful" /* GeneralSuccessMessage.UPDATED */ };
    }
    /**
     * Updates all entities with null workspaceId to the specified workspaceId
     * Used for migrating legacy data that was created before workspace implementation
     * This function is guaranteed to return meaningful results with affected row counts
     * @param queryRunner The TypeORM query runner to execute database operations
     * @param workspaceId The target workspaceId to assign to records with null workspaceId
     * @returns An array of update results, each containing the count of affected rows.
     * The array will always contain results for each entity type in the following order:
     * [ApiKey, Assistant, ChatFlow, Credential, CustomTemplate, Dataset, DocumentStore, Evaluation, Evaluator, Tool, Variable]
     */
    async setNullWorkspaceId(queryRunner, workspaceId) {
        return await Promise.all([
            queryRunner.manager.update(ApiKey_1.ApiKey, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(Assistant_1.Assistant, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(ChatFlow_1.ChatFlow, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(Credential_1.Credential, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(CustomTemplate_1.CustomTemplate, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(Dataset_1.Dataset, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(DocumentStore_1.DocumentStore, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(Evaluation_1.Evaluation, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(Evaluator_1.Evaluator, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(Execution_1.Execution, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(Tool_1.Tool, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId }),
            queryRunner.manager.update(Variable_1.Variable, { workspaceId: (0, typeorm_1.IsNull)() }, { workspaceId })
        ]);
    }
}
exports.WorkspaceService = WorkspaceService;
//# sourceMappingURL=workspace.service.js.map