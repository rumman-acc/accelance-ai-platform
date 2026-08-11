import { StatusCodes } from 'http-status-codes'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { Credential } from '../../database/entities/Credential'
import { CredentialAccess } from '../../database/entities/CredentialAccess'
import { WorkspaceShared } from '../../enterprise/database/entities/EnterpriseEntities'
import { WorkspaceUser, WorkspaceUserStatus } from '../../enterprise/database/entities/workspace-user.entity'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { getErrorMessage } from '../../errors/utils'
import { IReactFlowObject } from '../../Interface'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

/**
 * Does userId have access to credentialId? Checked in this order:
 * 1. userId is the credential's createdBy (its owner)
 * 2. an explicit CredentialAccess grant exists
 * 3. the credential is shared (via WorkspaceShared) into a workspace where userId is an
 *    active member -- this preserves today's actual behavior for cross-workspace-shared
 *    credentials without needing a CredentialAccess row per shared-workspace member.
 *
 * A missing/undefined userId (no authenticated principal -- public chatbot, API-key-triggered
 * run) is the caller's decision to make, not this function's -- see the tool-call policy
 * chokepoint (Phase 3), which skips this check entirely when there's no principal.
 */
const hasAccess = async (userId: string, credentialId: string): Promise<boolean> => {
    const appServer = getRunningExpressApp()

    const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({ id: credentialId })
    if (!credential) return false

    if (credential.createdBy && credential.createdBy === userId) return true

    const grant = await appServer.AppDataSource.getRepository(CredentialAccess).findOneBy({ credentialId, userId })
    if (grant) return true

    const sharedWorkspaces = await appServer.AppDataSource.getRepository(WorkspaceShared).find({
        where: { sharedItemId: credentialId, itemType: 'credential' }
    })
    if (!sharedWorkspaces.length) return false

    const membership = await appServer.AppDataSource.getRepository(WorkspaceUser).findOne({
        where: sharedWorkspaces.map((sw) => ({
            workspaceId: sw.workspaceId,
            userId,
            status: WorkspaceUserStatus.ACTIVE
        }))
    })
    return !!membership
}

/**
 * Non-blocking, build-time-only warnings for the flow builder: which of this chatflow's tool
 * nodes reference a credential the requesting (saving/deploying) user doesn't have access to.
 * Deliberately advisory -- the picker itself isn't filtered (see the plan's build-time UX
 * decision); this is the API-side half surfaced by the builder UI at save/deploy time. Hard
 * enforcement happens at execution time via the Phase 3 tool-call chokepoint, not here.
 */
const getCredentialAccessWarnings = async (chatflowId: string, workspaceId: string, userId?: string) => {
    try {
        const appServer = getRunningExpressApp()
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({ id: chatflowId, workspaceId })
        if (!chatflow) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }
        if (!userId) return []

        const parsedFlowData: IReactFlowObject = JSON.parse(chatflow.flowData)
        const nodesWithCredential = (parsedFlowData.nodes || []).filter((node) => !!node.data?.credential)

        const warnings: { nodeId: string; nodeLabel: string; credentialId: string }[] = []
        for (const node of nodesWithCredential) {
            const credentialId = node.data.credential as string
            const allowed = await hasAccess(userId, credentialId)
            if (!allowed) {
                warnings.push({ nodeId: node.id, nodeLabel: node.data.label, credentialId })
            }
        }
        return warnings
    } catch (error) {
        if (error instanceof InternalAccelanceError) throw error
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialAccessService.getCredentialAccessWarnings - ${getErrorMessage(error)}`
        )
    }
}

const listAccessForCredential = async (credentialId: string, workspaceId: string) => {
    try {
        const appServer = getRunningExpressApp()
        return await appServer.AppDataSource.getRepository(CredentialAccess).find({ where: { credentialId, workspaceId } })
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialAccessService.listAccessForCredential - ${getErrorMessage(error)}`
        )
    }
}

const grantAccess = async (credentialId: string, userId: string, workspaceId: string, grantedBy?: string) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(CredentialAccess)
        const existing = await repo.findOneBy({ credentialId, userId })
        if (existing) return existing
        const grant = repo.create({ credentialId, userId, workspaceId, grantedBy })
        return await repo.save(grant)
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialAccessService.grantAccess - ${getErrorMessage(error)}`
        )
    }
}

const revokeAccess = async (credentialId: string, userId: string, workspaceId: string) => {
    try {
        const appServer = getRunningExpressApp()
        return await appServer.AppDataSource.getRepository(CredentialAccess).delete({ credentialId, userId, workspaceId })
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialAccessService.revokeAccess - ${getErrorMessage(error)}`
        )
    }
}

export default {
    hasAccess,
    getCredentialAccessWarnings,
    listAccessForCredential,
    grantAccess,
    revokeAccess
}
