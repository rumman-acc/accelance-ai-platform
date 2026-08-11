import { DataSource } from 'typeorm'
import { ICommonObject, IDatabaseEntity } from './Interface'

export interface IToolPolicyContext {
    workspaceId: string
    chatflowId: string
    toolNodeName: string
    /** Undefined for unauthenticated/API-key/public-chatbot-triggered runs -- there is no
     * principal to check credential grants against; only the allowlist below still applies. */
    userId?: string
    credentialId?: string
}

export type IToolCallDecision = 'allowed' | 'denied'

const WORKSPACE_WIDE = ''

/**
 * Checks the AgentToolPolicy allowlist (most-specific-match-wins, defaults to allow when no row
 * exists), then -- only when there's both a principal and a credential -- CredentialAccess
 * ownership/grants, falling back to WorkspaceShared cross-workspace membership. Mirrors
 * services/tool-policy and services/credential-access on the server side; duplicated here
 * rather than imported, since this package has no dependency on the server package and only
 * ever reaches the database through the appDataSource/databaseEntities already threaded into
 * every node's options bag (the same pattern getCredentialData uses).
 */
export const evaluateToolCall = async (
    context: IToolPolicyContext,
    options: ICommonObject
): Promise<{ decision: IToolCallDecision; reason?: string }> => {
    const appDataSource = options.appDataSource as DataSource
    const databaseEntities = options.databaseEntities as IDatabaseEntity
    if (!appDataSource || !databaseEntities) {
        // Infra not available (shouldn't happen in practice) -- fail open rather than break
        // every tool call over a wiring gap.
        return { decision: 'allowed' }
    }

    const policyRepo = appDataSource.getRepository(databaseEntities['AgentToolPolicy'])
    const chatflowScoped = await policyRepo.findOneBy({
        workspaceId: context.workspaceId,
        chatflowId: context.chatflowId,
        toolNodeName: context.toolNodeName
    })
    const workspaceWide = chatflowScoped
        ? undefined
        : await policyRepo.findOneBy({
              workspaceId: context.workspaceId,
              chatflowId: WORKSPACE_WIDE,
              toolNodeName: context.toolNodeName
          })
    const effect = chatflowScoped?.effect ?? workspaceWide?.effect
    if (effect === 'deny') {
        return { decision: 'denied', reason: `Tool "${context.toolNodeName}" is not permitted for this agent` }
    }

    if (context.userId && context.credentialId) {
        const credential = await appDataSource.getRepository(databaseEntities['Credential']).findOneBy({ id: context.credentialId })
        if (credential) {
            const isOwner = credential.createdBy && credential.createdBy === context.userId
            if (!isOwner) {
                const grant = await appDataSource.getRepository(databaseEntities['CredentialAccess']).findOneBy({
                    credentialId: context.credentialId,
                    userId: context.userId
                })
                if (!grant) {
                    const sharedWorkspaces = await appDataSource.getRepository(databaseEntities['WorkspaceShared']).find({
                        where: { sharedItemId: context.credentialId, itemType: 'credential' }
                    })
                    let hasSharedAccess = false
                    if (sharedWorkspaces.length) {
                        const membership = await appDataSource.getRepository(databaseEntities['WorkspaceUser']).findOne({
                            where: sharedWorkspaces.map((sw: ICommonObject) => ({
                                workspaceId: sw.workspaceId,
                                userId: context.userId,
                                status: 'active'
                            }))
                        })
                        hasSharedAccess = !!membership
                    }
                    if (!hasSharedAccess) {
                        return { decision: 'denied', reason: `You don't have access to the credential this tool uses` }
                    }
                }
            }
        }
    }

    return { decision: 'allowed' }
}

const recordToolCallAudit = async (
    context: IToolPolicyContext,
    decision: IToolCallDecision,
    reason: string | undefined,
    options: ICommonObject
): Promise<void> => {
    try {
        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        if (!appDataSource || !databaseEntities) return
        const repo = appDataSource.getRepository(databaseEntities['ToolCallAudit'])
        const audit = repo.create({
            workspaceId: context.workspaceId,
            chatflowId: context.chatflowId,
            userId: context.userId,
            toolNodeName: context.toolNodeName,
            credentialId: context.credentialId,
            decision,
            reason
        })
        await repo.save(audit)
    } catch (e) {
        // Audit logging must never break a tool call.
        console.error('Failed to record tool call audit', e)
    }
}

/**
 * Wraps a LangChain Tool instance (or array of them) so every invocation of `_call` first runs
 * evaluateToolCall(). Mutates the instance's `_call` rather than replacing the object, since
 * `.call()` (the base class's public entry point, which drives callback/observability hooks
 * like handleToolStart/End/Error) always dispatches to `this._call(...)` -- overriding at that
 * layer means a denial surfaces as a normal tool-error observation through the existing
 * machinery, not a special case the LLM has to be taught about.
 */
export const wrapToolWithPolicy = <T>(tool: T, context: IToolPolicyContext, options: ICommonObject): T => {
    if (!tool) return tool
    if (Array.isArray(tool)) {
        return tool.map((t) => wrapToolWithPolicy(t, context, options)) as unknown as T
    }

    const toolInstance = tool as ICommonObject
    const originalCall = typeof toolInstance._call === 'function' ? toolInstance._call.bind(toolInstance) : undefined
    if (!originalCall) return tool

    toolInstance._call = async (...args: any[]) => {
        const { decision, reason } = await evaluateToolCall(context, options)
        await recordToolCallAudit(context, decision, reason, options)
        if (decision === 'denied') {
            throw new Error(reason || `Tool "${context.toolNodeName}" is not permitted`)
        }
        return originalCall(...args)
    }
    return tool
}
