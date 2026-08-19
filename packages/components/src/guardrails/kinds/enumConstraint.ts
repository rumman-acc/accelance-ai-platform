import { DataSource } from 'typeorm'
import { ICommonObject, IDatabaseEntity } from '../../Interface'
import { IGuardrailVerdict } from '../verdictTypes'

/**
 * Guardrails v2 Phase 2 -- confused_deputy_prevention's approximation of `enum_constraint`
 * (kinds.md): the "allowed set" is resolved dynamically (active members of the target
 * workspace), not a static list from params. Logic identical to
 * preflightGuardrails.ts's resolveTrustedToolCallerUserId -- this is the canvas-attached
 * equivalent, callable directly from AgentAsTool.ts with a node's own db-access options bag
 * (same appDataSource/databaseEntities pattern toolPolicy.ts already uses), no separate config
 * entity needed.
 */
export const verifyWorkspaceMembership = async (
    workspaceId: string,
    claimedUserId: string | undefined,
    options: ICommonObject
): Promise<IGuardrailVerdict> => {
    if (!claimedUserId) return { verdict: 'pass' }
    try {
        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        if (!appDataSource || !databaseEntities) return { verdict: 'pass' }

        const membership = await appDataSource.getRepository(databaseEntities['WorkspaceUser']).findOneBy({
            workspaceId,
            userId: claimedUserId,
            status: 'active'
        })
        if (membership) return { verdict: 'pass' }
        return {
            verdict: 'block',
            reason: `claimed user ${claimedUserId} is not an active member of this workspace`,
            evidence: { claimedUserId }
        }
    } catch (e) {
        // Fail CLOSED, not open, matching resolveTrustedToolCallerUserId's own semantics: this
        // check exists specifically to avoid trusting an unverified privileged claim, so an
        // inability to verify must resolve to "not trusted," never to "trusted by default."
        return { verdict: 'block', reason: `verification failed: ${e instanceof Error ? e.message : String(e)}` }
    }
}
