import { DataSource } from 'typeorm'
import { ICommonObject, IDatabaseEntity } from '../Interface'
import { checkEgressPattern, wrapPromptInjection, evaluateRegexMatch } from './kinds/regexMatch'
import { verifyWorkspaceMembership } from './kinds/enumConstraint'
import { IGuardrailVerdict } from './verdictTypes'

/**
 * Guardrails v2 Phase 2 -- resolves and runs guardrail nodes attached to a host node's
 * `guardrails` anchor. Per decision 3 ("no separate config entity"), an attached guardrail's
 * full config lives in its own node data -- for the classic build path (ToolAgent.ts and
 * friends), that anchor resolves generically via the existing `{{nodeId.data.instance}}`
 * substitution mechanism (packages/server/src/utils/index.ts resolveVariables/getVariableValue),
 * landing in `nodeData.inputs.guardrails` as a plain array of the connected Guardrail_* nodes'
 * own `init()` return values -- no reactFlowNodes/edge walk needed or even available (classic
 * node `options` carry no raw graph data, confirmed by direct trace).
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

const findAttachedGuardrailConfig = (guardrailConfigs: ICommonObject[] | undefined, definitionKey: string): ICommonObject | undefined => {
    if (!Array.isArray(guardrailConfigs)) return undefined
    return guardrailConfigs.find((c) => c?.definitionKey === definitionKey)
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

/** Called from agents/ToolAgent/ToolAgent.ts, pre-hook, before invoking a tool. */
export const runToolEgressGuardrails = async (
    guardrailConfigs: ICommonObject[] | undefined,
    args: unknown,
    context: IAttachedGuardrailContext,
    options: ICommonObject
): Promise<{ decision: 'allowed' | 'denied'; reason?: string }> => {
    const config = findAttachedGuardrailConfig(guardrailConfigs, 'egress_filtering')
    if (!config) return { decision: 'allowed' }
    const start = Date.now()
    const observeMode = config.observeMode !== false
    const verdict = checkEgressPattern(config, args)
    await recordAttachedGuardrailVerdict(context, 'egress_filtering', 'regex_match', verdict, observeMode, start, options)
    if (verdict.verdict === 'block' && !observeMode) {
        return { decision: 'denied', reason: `Egress Filtering: ${verdict.reason}` }
    }
    return { decision: 'allowed' }
}

/** Called from agents/ToolAgent/ToolAgent.ts, post-hook, after a tool call returns. */
export const runToolPromptInjectionGuardrails = async (
    guardrailConfigs: ICommonObject[] | undefined,
    result: unknown,
    context: IAttachedGuardrailContext,
    options: ICommonObject
): Promise<unknown> => {
    const config = findAttachedGuardrailConfig(guardrailConfigs, 'prompt_injection_defense')
    if (!config) return result
    const start = Date.now()
    const observeMode = config.observeMode !== false
    const verdict = wrapPromptInjection(result)
    await recordAttachedGuardrailVerdict(context, 'prompt_injection_defense', 'regex_match', verdict, observeMode, start, options)
    if (verdict.verdict === 'redact' && !observeMode) {
        return verdict.transformedPayload
    }
    return result
}

/** Called from tools/AgentAsTool/AgentAsTool.ts, pre-hook, before trusting a claimed principal. */
export const runAgentAsToolIdentityGuardrails = async (
    guardrailConfigs: ICommonObject[] | undefined,
    claimedUserId: string | undefined,
    context: IAttachedGuardrailContext,
    options: ICommonObject
): Promise<boolean> => {
    const config = findAttachedGuardrailConfig(guardrailConfigs, 'confused_deputy_prevention')
    if (!config) return false
    const start = Date.now()
    const observeMode = config.observeMode !== false
    const verdict = await verifyWorkspaceMembership(context.workspaceId, claimedUserId, options)
    await recordAttachedGuardrailVerdict(context, 'confused_deputy_prevention', 'enum_constraint', verdict, observeMode, start, options)
    // Decision 5 (observe-first) applied to a "grant" rather than a "block" action: even a
    // claim that WOULD verify successfully doesn't get real trust from this new mechanism
    // until the node is explicitly promoted (observeMode=false) -- matching "every guardrail
    // ships in flag mode" uniformly, rather than special-casing this guardrail as always-on
    // just because its safe default already happens to be "don't trust."
    return verdict.verdict === 'pass' && !observeMode
}

const safeStringify = (value: unknown): string => {
    if (typeof value === 'string') return value
    try {
        return JSON.stringify(value)
    } catch {
        return String(value)
    }
}

/**
 * Guardrails v2 Phase 3 -- the FIRST generic dispatcher in this file. Unlike the two functions
 * above (hardcoded to one specific built-in `definitionKey` each, matching how `ToolAgent.ts`
 * wires them at fixed call sites), a custom definition is authored data, not a call site --
 * many different custom `regex_match` definitions share the same generic wrapper node, so
 * *where* each one runs (`hookPoint`) has to be decided from the definition's own `hooks`
 * field (`'pre'|'post'`, see services/guardrails/index.ts's HOOK_SELECTABLE_KIND_KEYS), not
 * from which function got called. Only matches configs carrying `origin:'custom'` -- the 2
 * built-in keys are already handled above and must never double-run through this path.
 *
 * `action:'flag'` never blocks or transforms on either hook -- it only ever records a verdict
 * -- matching kinds.md's own semantics table. `action:'block'` is only meaningful pre-call
 * (nothing to "block" once a result already exists); `action:'redact'` is only meaningful
 * post-call (mirrors prompt_injection_defense's own redact-only post-hook). A `block` verdict
 * for a `post`-hooked definition, or a `redact` verdict for a `pre`-hooked one, is recorded
 * but has no additional effect -- an odd combination, not a crash.
 */
export const runCustomToolCallGuardrails = async (
    guardrailConfigs: ICommonObject[] | undefined,
    hookPoint: 'pre' | 'post',
    payload: unknown,
    context: IAttachedGuardrailContext,
    options: ICommonObject
): Promise<{ decision: 'allowed' | 'denied'; reason?: string; transformedPayload: unknown }> => {
    if (!Array.isArray(guardrailConfigs)) return { decision: 'allowed', transformedPayload: payload }

    const matches = guardrailConfigs.filter((c) => c?.origin === 'custom' && c?.hooks === hookPoint && c?.kindKey === 'regex_match')

    let currentPayload = payload
    for (const config of matches) {
        const start = Date.now()
        const observeMode = config.observeMode !== false
        const content = safeStringify(currentPayload)
        const verdict = evaluateRegexMatch(
            { pattern: config.pattern as string, action: config.action as 'block' | 'flag' | 'redact' },
            content
        )
        await recordAttachedGuardrailVerdict(context, config.definitionKey as string, 'regex_match', verdict, observeMode, start, options)

        if (hookPoint === 'pre' && verdict.verdict === 'block' && !observeMode) {
            return { decision: 'denied', reason: `${config.definitionKey}: ${verdict.reason}`, transformedPayload: currentPayload }
        }
        if (hookPoint === 'post' && verdict.verdict === 'redact' && !observeMode && verdict.transformedPayload !== undefined) {
            currentPayload = verdict.transformedPayload
        }
    }
    return { decision: 'allowed', transformedPayload: currentPayload }
}

/**
 * Mutates each tool's `_call` (same technique as toolPolicy.ts's wrapToolWithPolicy, kept
 * independent of it rather than composed -- this is the new, opt-in, per-node attached
 * mechanism, unrelated to the legacy chatflow/workspace-toggle path) so egress_filtering and
 * prompt_injection_defense, if attached to this host node's own `guardrails` anchor, run around
 * every tool call this host node makes. A no-op when no relevant guardrail is attached.
 */
export const wrapToolsWithAttachedGuardrails = <T>(
    tool: T,
    guardrailConfigs: ICommonObject[] | undefined,
    context: IAttachedGuardrailContext,
    options: ICommonObject
): T => {
    if (!tool) return tool
    if (Array.isArray(tool)) {
        return tool.map((t) => wrapToolsWithAttachedGuardrails(t, guardrailConfigs, context, options)) as unknown as T
    }
    if (!guardrailConfigs?.length) return tool

    const toolInstance = tool as ICommonObject
    const originalCall = typeof toolInstance._call === 'function' ? toolInstance._call.bind(toolInstance) : undefined
    if (!originalCall) return tool

    toolInstance._call = async (...args: any[]) => {
        const egress = await runToolEgressGuardrails(guardrailConfigs, args, context, options)
        if (egress.decision === 'denied') {
            throw new Error(egress.reason || `Tool call blocked by an attached guardrail`)
        }
        const customPre = await runCustomToolCallGuardrails(guardrailConfigs, 'pre', args, context, options)
        if (customPre.decision === 'denied') {
            throw new Error(customPre.reason || `Tool call blocked by an attached custom guardrail`)
        }

        const result = await originalCall(...args)
        const afterBuiltins = await runToolPromptInjectionGuardrails(guardrailConfigs, result, context, options)
        const customPost = await runCustomToolCallGuardrails(guardrailConfigs, 'post', afterBuiltins, context, options)
        return customPost.transformedPayload
    }
    return tool
}
