import { DataSource } from 'typeorm'
import { ICommonObject, IDatabaseEntity } from '../Interface'
import { checkEgressPattern, wrapPromptInjection } from './kinds/regexMatch'
import { verifyWorkspaceMembership } from './kinds/enumConstraint'
import { IGuardrailVerdict } from './verdictTypes'

/**
 * Guardrails v2 Phase 2 -- resolves and runs guardrail nodes attached to a host node's
 * `guardrails` anchor. Per decision 3 ("no separate config entity"), an attached guardrail's
 * full config lives in its own `data.inputs` -- reached here by walking the same
 * `reactFlowNodes` array every host node already has in scope to resolve `agentTools`/`tools`,
 * no DB read needed to find the attachment itself. A DB read only happens to write the
 * resulting GuardrailVerdict row.
 *
 * Only 3 call shapes exist for the 3 in-scope keys (egress_filtering, prompt_injection_defense,
 * confused_deputy_prevention), each with a genuinely different payload/host-node shape -- kept
 * as 3 small, honestly-named exports rather than forced into one generic dispatcher.
 */

interface IAttachedGuardrailContext {
    workspaceId: string
    chatflowId: string
    hostNodeId: string
}

const findAttachedGuardrailNode = (reactFlowNodes: ICommonObject[], guardrailNodeIds: string[], definitionKey: string) => {
    return reactFlowNodes.find(
        (n) => guardrailNodeIds.includes(n.id) && n.data?.category === 'Guardrails' && n.data?.inputs?.definitionKey === definitionKey
    )
}

const recordAttachedGuardrailVerdict = async (
    context: IAttachedGuardrailContext,
    definitionKey: string,
    kindKey: string,
    verdict: IGuardrailVerdict,
    observeMode: boolean,
    startedAt: number,
    options: ICommonObject
): Promise<void> => {
    try {
        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        if (!appDataSource || !databaseEntities) return
        const repo = appDataSource.getRepository(databaseEntities['GuardrailVerdict'])
        await repo.save(
            repo.create({
                workspaceId: context.workspaceId,
                chatflowId: context.chatflowId,
                // The real per-node granularity §2.1 was written for -- unlike Phase 1's
                // chatflow-level shadow verdicts, this is the actual host node's id.
                nodeId: context.hostNodeId,
                definitionKey,
                kindKey,
                verdict: verdict.verdict,
                reason: verdict.reason,
                evidence: verdict.evidence ? JSON.stringify(verdict.evidence) : undefined,
                latencyMs: Date.now() - startedAt,
                observeMode
            })
        )
    } catch (e) {
        // Verdict recording must never affect the real guardrail decision.
        console.error('Failed to record attached guardrail verdict', e)
    }
}

/** Called from agentflow/Tool/Tool.ts, pre-hook, alongside the existing checkEgressFiltering. */
export const runToolEgressGuardrails = async (
    reactFlowNodes: ICommonObject[],
    guardrailNodeIds: string[],
    args: unknown,
    context: IAttachedGuardrailContext,
    options: ICommonObject
): Promise<{ decision: 'allowed' | 'denied'; reason?: string }> => {
    const node = findAttachedGuardrailNode(reactFlowNodes, guardrailNodeIds, 'egress_filtering')
    if (!node) return { decision: 'allowed' }
    const start = Date.now()
    const observeMode = node.data.inputs.observeMode !== false
    const verdict = checkEgressPattern(node.data.inputs, args)
    await recordAttachedGuardrailVerdict(context, 'egress_filtering', 'regex_match', verdict, observeMode, start, options)
    if (verdict.verdict === 'block' && !observeMode) {
        return { decision: 'denied', reason: `Egress Filtering: ${verdict.reason}` }
    }
    return { decision: 'allowed' }
}

/** Called from agentflow/Tool/Tool.ts, post-hook, alongside the existing applyPromptInjectionWrapping. */
export const runToolPromptInjectionGuardrails = async (
    reactFlowNodes: ICommonObject[],
    guardrailNodeIds: string[],
    result: unknown,
    context: IAttachedGuardrailContext,
    options: ICommonObject
): Promise<unknown> => {
    const node = findAttachedGuardrailNode(reactFlowNodes, guardrailNodeIds, 'prompt_injection_defense')
    if (!node) return result
    const start = Date.now()
    const observeMode = node.data.inputs.observeMode !== false
    const verdict = wrapPromptInjection(result)
    await recordAttachedGuardrailVerdict(context, 'prompt_injection_defense', 'regex_match', verdict, observeMode, start, options)
    if (verdict.verdict === 'redact' && !observeMode) {
        return verdict.transformedPayload
    }
    return result
}

/** Called from tools/AgentAsTool/AgentAsTool.ts, pre-hook, before trusting a claimed principal. */
export const runAgentAsToolIdentityGuardrails = async (
    reactFlowNodes: ICommonObject[],
    guardrailNodeIds: string[],
    claimedUserId: string | undefined,
    context: IAttachedGuardrailContext,
    options: ICommonObject
): Promise<boolean> => {
    const node = findAttachedGuardrailNode(reactFlowNodes, guardrailNodeIds, 'confused_deputy_prevention')
    if (!node) return false
    const start = Date.now()
    const observeMode = node.data.inputs.observeMode !== false
    const verdict = await verifyWorkspaceMembership(context.workspaceId, claimedUserId, options)
    await recordAttachedGuardrailVerdict(context, 'confused_deputy_prevention', 'enum_constraint', verdict, observeMode, start, options)
    // Decision 5 (observe-first) applied to a "grant" rather than a "block" action: even a
    // claim that WOULD verify successfully doesn't get real trust from this new mechanism
    // until the node is explicitly promoted (observeMode=false) -- matching "every guardrail
    // ships in flag mode" uniformly, rather than special-casing this guardrail as always-on
    // just because its safe default already happens to be "don't trust."
    return verdict.verdict === 'pass' && !observeMode
}
