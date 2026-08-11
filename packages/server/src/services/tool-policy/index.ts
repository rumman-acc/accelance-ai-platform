import { StatusCodes } from 'http-status-codes'
import { AgentToolPolicy, AgentToolPolicyEffect } from '../../database/entities/AgentToolPolicy'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

// Sentinel for "workspace-wide default" -- see AgentToolPolicy entity comment for why this is
// an empty string rather than null.
const WORKSPACE_WIDE = ''

/**
 * May this tool node run for this agent? Most-specific-match-wins: a chatflow-scoped row beats
 * the workspace-wide default; no matching row at all defaults to allow (permissive by design --
 * a workspace tightens this deliberately, once it's inventoried real tool usage, rather than
 * every existing flow breaking the moment this ships).
 */
const evaluate = async (workspaceId: string, chatflowId: string, toolNodeName: string): Promise<AgentToolPolicyEffect> => {
    const appServer = getRunningExpressApp()
    const repo = appServer.AppDataSource.getRepository(AgentToolPolicy)

    const chatflowScoped = await repo.findOneBy({ workspaceId, chatflowId, toolNodeName })
    if (chatflowScoped) return chatflowScoped.effect

    const workspaceWide = await repo.findOneBy({ workspaceId, chatflowId: WORKSPACE_WIDE, toolNodeName })
    if (workspaceWide) return workspaceWide.effect

    return AgentToolPolicyEffect.ALLOW
}

const listPolicies = async (workspaceId: string, chatflowId?: string) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(AgentToolPolicy)
        // Always include the workspace-wide defaults alongside whichever chatflow's rows were asked for.
        return await repo
            .createQueryBuilder('policy')
            .where('policy.workspaceId = :workspaceId', { workspaceId })
            .andWhere(chatflowId ? '(policy.chatflowId = :chatflowId OR policy.chatflowId = :workspaceWide)' : '1=1', {
                chatflowId,
                workspaceWide: WORKSPACE_WIDE
            })
            .getMany()
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: toolPolicyService.listPolicies - ${getErrorMessage(error)}`
        )
    }
}

const upsertPolicy = async (
    workspaceId: string,
    chatflowId: string | undefined,
    toolNodeName: string,
    effect: AgentToolPolicyEffect,
    createdBy?: string
) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(AgentToolPolicy)
        const scopedChatflowId = chatflowId || WORKSPACE_WIDE
        const existing = await repo.findOneBy({ workspaceId, chatflowId: scopedChatflowId, toolNodeName })
        if (existing) {
            existing.effect = effect
            return await repo.save(existing)
        }
        const policy = repo.create({ workspaceId, chatflowId: scopedChatflowId, toolNodeName, effect, createdBy })
        return await repo.save(policy)
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: toolPolicyService.upsertPolicy - ${getErrorMessage(error)}`
        )
    }
}

const deletePolicy = async (id: string, workspaceId: string) => {
    try {
        const appServer = getRunningExpressApp()
        return await appServer.AppDataSource.getRepository(AgentToolPolicy).delete({ id, workspaceId })
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: toolPolicyService.deletePolicy - ${getErrorMessage(error)}`
        )
    }
}

export default {
    evaluate,
    listPolicies,
    upsertPolicy,
    deletePolicy
}
