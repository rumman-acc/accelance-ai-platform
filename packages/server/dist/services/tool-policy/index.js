"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const AgentToolPolicy_1 = require("../../database/entities/AgentToolPolicy");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
// Sentinel for "workspace-wide default" -- see AgentToolPolicy entity comment for why this is
// an empty string rather than null.
const WORKSPACE_WIDE = '';
/**
 * May this tool node run for this agent? Most-specific-match-wins: a chatflow-scoped row beats
 * the workspace-wide default; no matching row at all defaults to allow (permissive by design --
 * a workspace tightens this deliberately, once it's inventoried real tool usage, rather than
 * every existing flow breaking the moment this ships).
 */
const evaluate = async (workspaceId, chatflowId, toolNodeName) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const repo = appServer.AppDataSource.getRepository(AgentToolPolicy_1.AgentToolPolicy);
    const chatflowScoped = await repo.findOneBy({ workspaceId, chatflowId, toolNodeName });
    if (chatflowScoped)
        return chatflowScoped.effect;
    const workspaceWide = await repo.findOneBy({ workspaceId, chatflowId: WORKSPACE_WIDE, toolNodeName });
    if (workspaceWide)
        return workspaceWide.effect;
    return AgentToolPolicy_1.AgentToolPolicyEffect.ALLOW;
};
const listPolicies = async (workspaceId, chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(AgentToolPolicy_1.AgentToolPolicy);
        // Always include the workspace-wide defaults alongside whichever chatflow's rows were asked for.
        return await repo
            .createQueryBuilder('policy')
            .where('policy.workspaceId = :workspaceId', { workspaceId })
            .andWhere(chatflowId ? '(policy.chatflowId = :chatflowId OR policy.chatflowId = :workspaceWide)' : '1=1', {
            chatflowId,
            workspaceWide: WORKSPACE_WIDE
        })
            .getMany();
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolPolicyService.listPolicies - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const upsertPolicy = async (workspaceId, chatflowId, toolNodeName, effect, createdBy) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(AgentToolPolicy_1.AgentToolPolicy);
        const scopedChatflowId = chatflowId || WORKSPACE_WIDE;
        const existing = await repo.findOneBy({ workspaceId, chatflowId: scopedChatflowId, toolNodeName });
        if (existing) {
            existing.effect = effect;
            return await repo.save(existing);
        }
        const policy = repo.create({ workspaceId, chatflowId: scopedChatflowId, toolNodeName, effect, createdBy });
        return await repo.save(policy);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolPolicyService.upsertPolicy - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deletePolicy = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        return await appServer.AppDataSource.getRepository(AgentToolPolicy_1.AgentToolPolicy).delete({ id, workspaceId });
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolPolicyService.deletePolicy - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    evaluate,
    listPolicies,
    upsertPolicy,
    deletePolicy
};
//# sourceMappingURL=index.js.map