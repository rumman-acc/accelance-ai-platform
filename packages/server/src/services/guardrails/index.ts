import { StatusCodes } from 'http-status-codes'
import { GuardrailCatalogItem } from '../../database/entities/GuardrailCatalogItem'
import { GuardrailPolicy } from '../../database/entities/GuardrailPolicy'
import {
    GuardrailDefinition,
    GuardrailOrigin,
    GuardrailPlacement,
    GuardrailOnFailAction,
    GuardrailFailMode
} from '../../database/entities/GuardrailDefinition'
import { GuardrailFlowAttachment } from '../../database/entities/GuardrailFlowAttachment'
import { GuardrailVerdict } from '../../database/entities/GuardrailVerdict'
import { AgentToolPolicy } from '../../database/entities/AgentToolPolicy'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const WORKSPACE_WIDE = ''

/**
 * Guardrails v2 -- see rules/guardrails-v2/ and the "Guardrails Rearchitecture Phase 0 + Phase 1"
 * implementation plan for the full rationale. This file now serves two, deliberately separate,
 * mechanisms side by side:
 *
 *  1. `resolveGuardrailAttachment` reads GuardrailFlowAttachment -- the new, chatflow-scoped
 *     source of truth for the 7 keys backfilled from the old model (pii_redaction,
 *     topic_action_scoping, spend_token_budgets, prompt_injection_defense, egress_filtering,
 *     confused_deputy_prevention, loop_recursion_detection). See phase0-audit.md Finding 4.
 *  2. `evaluate` still reads the OLD GuardrailPolicy table, unchanged, and is the ONLY thing
 *     that ever decides real enforcement for those 7 keys during Phase 1 -- resolved verdicts
 *     from (1) are recorded for comparison but never gate a real decision. See
 *     rules/guardrails-v2/reconciliation.md's "one caveat" section for why this distinction is
 *     load-bearing specifically for egress_filtering/prompt_injection_defense.
 *
 * `listCatalog`, `createCustomCatalogItem`, `applyDefaultPolicyTemplate` and
 * `DEFAULT_POLICY_TEMPLATE` are removed per build-plan §2.2 -- custom-catalog authoring and
 * retroactive apply are deleted, not deferred. `listPolicies`/`upsertPolicy`/`deletePolicy`
 * are KEPT, unchanged, because real functionality still depends on them: the per-agent canvas
 * panel's override toggle for the 7 backfilled keys (still reads GuardrailPolicy via evaluate()
 * -- the OLD path is what's actually deciding during the observe window, so its own toggle UI
 * must keep writing to that same table), and the /compliance page's data_retention_policy
 * toggle (one of the four real, workspace-scoped exceptions that never leaves this table).
 * upsertPolicy now rejects 'policy_templates' specifically, since its retroactive-apply
 * mechanism no longer exists -- toggling it would be an accepted-but-inert no-op.
 * `GuardrailPolicy`/`GuardrailCatalogItem` themselves are untouched -- see the implementation
 * plan for why the tables aren't dropped.
 */

/**
 * System definitions (workspaceId IS NULL) plus this workspace's own custom definitions,
 * excluding soft-deleted/superseded rows. Replaces the old listCatalog -- GuardrailDefinition
 * was seeded with a row for every key that still matters for catalog display, including the
 * four workspace-scoped exceptions above (as catalog-only entries with no attachment behavior),
 * so nothing disappears from `/guardrails` by repointing this at the new table.
 */
const listDefinitions = async (workspaceId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailDefinition)
        return await repo
            .createQueryBuilder('def')
            .where('def.deletedAt IS NULL')
            .andWhere('def.supersededByDefinitionId IS NULL')
            .andWhere('(def.workspaceId IS NULL OR def.workspaceId = :workspaceId)', { workspaceId })
            .orderBy('def.category', 'ASC')
            .addOrderBy('def.name', 'ASC')
            .getMany()
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: guardrailsService.listDefinitions - ${getErrorMessage(error)}`
        )
    }
}

/**
 * Guardrails v2 Phase 3 -- kinds a custom definition may be authored against today. Only
 * kinds with a real, generic, config-driven executor belong here -- see
 * rules/guardrails-v2/phase3-authoring.md for why this started at zero (neither pre-existing
 * "kind executor" was actually generic) and is currently exactly one. Each entry validates its
 * own `defaultParams` shape at creation time, so a malformed custom definition is rejected up
 * front rather than saved and silently doing nothing when attached.
 */
const AUTHORING_KIND_VALIDATORS: Record<string, (params: Record<string, unknown>) => string | null> = {
    regex_match: (params) => {
        if (typeof params.pattern !== 'string' || !params.pattern) return '"pattern" must be a non-empty string'
        try {
            // eslint-disable-next-line no-new
            new RegExp(params.pattern)
        } catch (e) {
            return `"pattern" is not a valid regular expression: ${e instanceof Error ? e.message : String(e)}`
        }
        if (!['block', 'flag', 'redact'].includes(params.action as string)) return '"action" must be one of block, flag, redact'
        return null
    }
}

const AUTHORING_PARAM_SCHEMAS: Record<string, string> = {
    regex_match: JSON.stringify({ pattern: 'string', action: 'string' })
}

/**
 * Creates a workspace-scoped custom GuardrailDefinition row (origin:'custom'). This is the
 * Phase 3 authoring entry point -- see phase3-authoring-mechanism.md for why the definition
 * itself carries the real config (defaultParams) rather than a canvas node: the generic
 * wrapper node a user drags is shared across every custom definition, so it can only ever
 * select one by key, not carry its own pattern. `defaultObserveMode` is deliberately NOT a
 * client-controllable input -- decision 5 (observe-first) is non-negotiable, every new
 * definition starts observe-only regardless of what the request body contains.
 */
const createCustomDefinition = async (
    workspaceId: string,
    params: {
        key: string
        name: string
        description?: string
        kindKey: string
        defaultParams: Record<string, unknown>
        defaultOnFailAction?: string
        defaultFailMode?: string
        defaultTimeoutMs?: number
    },
    createdBy?: string
) => {
    try {
        const validator = AUTHORING_KIND_VALIDATORS[params.kindKey]
        if (!validator) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsService.createCustomDefinition - kindKey "${params.kindKey}" has no generic executor yet, only regex_match is authorable today`
            )
        }
        if (!params.key || !/^[a-z0-9_]+$/.test(params.key)) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsService.createCustomDefinition - "key" must be lowercase letters, numbers, and underscores only`
            )
        }
        if (!params.name) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsService.createCustomDefinition - "name" is required`
            )
        }
        const paramError = validator(params.defaultParams || {})
        if (paramError) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsService.createCustomDefinition - ${paramError}`
            )
        }

        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailDefinition)

        const existing = await repo
            .createQueryBuilder('def')
            .where('def.key = :key', { key: params.key })
            .andWhere('def.workspaceId = :workspaceId', { workspaceId })
            .getOne()
        if (existing) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsService.createCustomDefinition - a custom definition with key "${params.key}" already exists in this workspace`
            )
        }

        const definition = repo.create({
            key: params.key,
            name: params.name,
            description: params.description || '',
            origin: GuardrailOrigin.CUSTOM,
            category: 'custom',
            kindKey: params.kindKey,
            placement: GuardrailPlacement.ATTACHED,
            paramSchema: AUTHORING_PARAM_SCHEMAS[params.kindKey],
            defaultParams: JSON.stringify(params.defaultParams),
            defaultOnFailAction: (params.defaultOnFailAction as GuardrailOnFailAction) || GuardrailOnFailAction.FLAG,
            defaultFailMode: (params.defaultFailMode as GuardrailFailMode) || GuardrailFailMode.OPEN,
            defaultTimeoutMs: params.defaultTimeoutMs || 5000,
            defaultObserveMode: true,
            version: 1,
            workspaceId,
            createdBy
        })
        return await repo.save(definition)
    } catch (error) {
        if (error instanceof InternalAccelanceError) throw error
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: guardrailsService.createCustomDefinition - ${getErrorMessage(error)}`
        )
    }
}

/**
 * The new resolver for the 7 backfilled keys. Chatflow-scoped only -- no workspace-wide
 * fallback needed, since the backfill migration already expanded every enabled workspace-wide
 * GuardrailPolicy row into one GuardrailFlowAttachment row per chatflow in that workspace.
 * Fails open (enabled:false) on any error, mirroring evaluateGuardrailPolicy's existing
 * fail-open contract in packages/components/src/toolPolicy.ts. NEVER used to gate a real
 * decision in Phase 1 -- purely observational, see the file-level comment above.
 */
const resolveGuardrailAttachment = async (
    chatflowId: string,
    definitionKey: string
): Promise<{ enabled: boolean; config?: Record<string, unknown>; kindKey?: string; observeMode?: boolean }> => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailFlowAttachment)
        const row = await repo.findOneBy({ chatflowId, definitionKey })
        if (!row) return { enabled: false }
        try {
            return {
                enabled: true,
                config: row.paramsSnapshot ? JSON.parse(row.paramsSnapshot) : undefined,
                kindKey: row.kindKey,
                observeMode: row.observeMode
            }
        } catch {
            return { enabled: true, kindKey: row.kindKey, observeMode: row.observeMode }
        }
    } catch {
        return { enabled: false }
    }
}

/**
 * Whether a resolved attachment has been explicitly promoted to actually enforce, rather than
 * just observe. Nothing in this codebase ever sets observeMode to false -- promotion is a
 * future, separately reviewed action (Phase 2+ UI, or a one-off manual update after reviewing
 * a real diff of recorded verdicts). This is the single choke-point every real-decision call
 * site must check before letting a resolved attachment's verdict actually do anything.
 */
const isPromoted = (attachment: { enabled: boolean; observeMode?: boolean }): boolean =>
    attachment.enabled && attachment.observeMode === false

/**
 * Append-only write, per build-plan §2.1 -- "guardrail verdicts must be recorded per
 * chatflowId + nodeId + definitionId from Phase 1." Never throws -- a logging failure must
 * never affect the guardrail decision or the request it's attached to.
 */
const recordVerdict = async (params: {
    workspaceId: string
    chatflowId: string
    nodeId?: string
    definitionKey: string
    kindKey: string
    verdict: string
    reason?: string
    evidence?: Record<string, unknown>
    latencyMs: number
    observeMode: boolean
}): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailVerdict)
        await repo.save(
            repo.create({
                workspaceId: params.workspaceId,
                chatflowId: params.chatflowId,
                nodeId: params.nodeId ?? '',
                definitionKey: params.definitionKey,
                kindKey: params.kindKey,
                verdict: params.verdict,
                reason: params.reason,
                evidence: params.evidence ? JSON.stringify(params.evidence) : undefined,
                latencyMs: params.latencyMs,
                observeMode: params.observeMode
            })
        )
    } catch (e) {
        console.error('Failed to record guardrail verdict', e)
    }
}

/**
 * Unchanged from before this migration -- still reads GuardrailPolicy directly. Still the ONLY
 * thing that decides real enforcement for the 7 backfilled keys during Phase 1 -- see the
 * file-level comment above for why.
 */
const evaluate = async (
    workspaceId: string,
    chatflowId: string,
    catalogKey: string
): Promise<{ enabled: boolean; config?: Record<string, unknown> }> => {
    const appServer = getRunningExpressApp()
    const repo = appServer.AppDataSource.getRepository(GuardrailPolicy)

    const chatflowScoped = await repo.findOneBy({ workspaceId, chatflowId, catalogKey })
    const row = chatflowScoped ?? (await repo.findOneBy({ workspaceId, chatflowId: WORKSPACE_WIDE, catalogKey }))
    if (!row || !row.enabled) return { enabled: false }

    if (row.config) {
        try {
            return { enabled: true, config: JSON.parse(row.config) }
        } catch {
            return { enabled: true }
        }
    }
    const catalogItem = await appServer.AppDataSource.getRepository(GuardrailCatalogItem).findOneBy({ key: catalogKey })
    if (catalogItem?.defaultConfig) {
        try {
            return { enabled: true, config: JSON.parse(catalogItem.defaultConfig) }
        } catch {
            return { enabled: true }
        }
    }
    return { enabled: true }
}

const listPolicies = async (workspaceId: string, chatflowId?: string) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailPolicy)
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
            `Error: guardrailsService.listPolicies - ${getErrorMessage(error)}`
        )
    }
}

const upsertPolicy = async (
    workspaceId: string,
    chatflowId: string | undefined,
    catalogKey: string,
    enabled: boolean,
    config: Record<string, unknown> | undefined,
    createdBy?: string
) => {
    try {
        if (catalogKey === 'policy_templates') {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsService.upsertPolicy - "Policy Templates" was removed in Guardrails v2 (its retroactive-apply mechanism no longer exists)`
            )
        }
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailPolicy)
        const scopedChatflowId = chatflowId || WORKSPACE_WIDE
        const existing = await repo.findOneBy({ workspaceId, chatflowId: scopedChatflowId, catalogKey })
        const configStr = config ? JSON.stringify(config) : undefined
        if (existing) {
            existing.enabled = enabled
            existing.config = configStr
            return await repo.save(existing)
        }
        const policy = repo.create({ workspaceId, chatflowId: scopedChatflowId, catalogKey, enabled, config: configStr, createdBy })
        return await repo.save(policy)
    } catch (error) {
        if (error instanceof InternalAccelanceError) throw error
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: guardrailsService.upsertPolicy - ${getErrorMessage(error)}`
        )
    }
}

const deletePolicy = async (id: string, workspaceId: string) => {
    try {
        const appServer = getRunningExpressApp()
        return await appServer.AppDataSource.getRepository(GuardrailPolicy).delete({ id, workspaceId })
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: guardrailsService.deletePolicy - ${getErrorMessage(error)}`
        )
    }
}

// content_moderation and hitl_approval_gates aren't gated by an attachment/policy row at all --
// their real behavior is detecting whether a matching node is actually present in the chatflow's
// own flowData, same as before this migration. nodeNames still lives on the OLD
// GuardrailCatalogItem row for these two keys (untouched by this migration) since
// GuardrailDefinition never gained an equivalent field -- no code path needed it.
const NODE_DETECTION_KEYS = ['content_moderation', 'hitl_approval_gates']

const BACKFILLED_KEYS = [
    'pii_redaction',
    'topic_action_scoping',
    'spend_token_budgets',
    'prompt_injection_defense',
    'egress_filtering',
    'confused_deputy_prevention',
    'loop_recursion_detection'
]

/**
 * Merged view for the canvas "Guardrails & Compliance" panel. tool_allowlist reads
 * AgentToolPolicy directly (unchanged); NODE_DETECTION_KEYS scan the chatflow's own flowData
 * (unchanged); the 7 backfilled keys' DISPLAYED state still reflects the OLD GuardrailPolicy
 * table -- that's what's actually deciding enforcement right now, so the display must agree
 * with it rather than the new (shadow-only) model; the remaining exceptions
 * (memory_rag_write_validation, audit_log, data_retention_policy) also read GuardrailPolicy.
 */
const getSummary = async (workspaceId: string, chatflowId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const definitions = await listDefinitions(workspaceId)

        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({ id: chatflowId })
        let flowNodeNames: string[] = []
        if (chatflow?.flowData) {
            try {
                const parsed = JSON.parse(chatflow.flowData)
                flowNodeNames = (parsed.nodes ?? []).map((n: any) => n?.data?.name).filter(Boolean)
            } catch {
                flowNodeNames = []
            }
        }

        const toolPolicyCount = await appServer.AppDataSource.getRepository(AgentToolPolicy).count({ where: { workspaceId } })

        const items = await Promise.all(
            definitions.map(async (def) => {
                if (def.key === 'tool_allowlist') {
                    return {
                        catalogKey: def.key,
                        name: def.name,
                        description: def.description,
                        isNode: false,
                        isToolAllowlist: true,
                        active: toolPolicyCount > 0,
                        source: toolPolicyCount > 0 ? 'tool-access-policy' : 'none',
                        managedVia: '/tool-policy'
                    }
                }
                if (NODE_DETECTION_KEYS.includes(def.key)) {
                    const legacyCatalogItem = await appServer.AppDataSource.getRepository(GuardrailCatalogItem).findOneBy({
                        key: def.key
                    })
                    const nodeNames: string[] = legacyCatalogItem?.nodeNames ? JSON.parse(legacyCatalogItem.nodeNames) : []
                    const present = nodeNames.some((n) => flowNodeNames.includes(n))
                    return {
                        catalogKey: def.key,
                        name: def.name,
                        description: def.description,
                        isNode: true,
                        isToolAllowlist: false,
                        active: present,
                        source: present ? 'canvas-node' : 'none'
                    }
                }
                if (BACKFILLED_KEYS.includes(def.key)) {
                    const resolved = await evaluate(workspaceId, chatflowId, def.key)
                    return {
                        catalogKey: def.key,
                        name: def.name,
                        description: def.description,
                        isNode: false,
                        isToolAllowlist: false,
                        active: resolved.enabled,
                        source: resolved.enabled ? 'attached' : 'none'
                    }
                }
                const resolvedLegacy = await evaluate(workspaceId, WORKSPACE_WIDE, def.key)
                return {
                    catalogKey: def.key,
                    name: def.name,
                    description: def.description,
                    isNode: false,
                    isToolAllowlist: false,
                    active: resolvedLegacy.enabled,
                    source: resolvedLegacy.enabled ? 'workspace-default' : 'none'
                }
            })
        )

        return { items, activeCount: items.filter((i) => i.active).length }
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: guardrailsService.getSummary - ${getErrorMessage(error)}`
        )
    }
}

/**
 * Called from utilAddChatMessage() on every message save. Returns null (skip redaction
 * entirely) unless pii_redaction is enabled for this workspace/chatflow. The real decision
 * below is UNCHANGED, still driven by the old GuardrailPolicy-backed evaluate(). A shadow
 * verdict against the new model is recorded alongside, purely for later comparison -- it never
 * influences whether redaction actually happens.
 */
const getActiveRedactionPatterns = async (workspaceId: string, chatflowId: string): Promise<string[] | null> => {
    const start = Date.now()
    const row = await evaluate(workspaceId, chatflowId, 'pii_redaction')

    const shadow = await resolveGuardrailAttachment(chatflowId, 'pii_redaction')
    if (shadow.enabled) {
        await recordVerdict({
            workspaceId,
            chatflowId,
            definitionKey: 'pii_redaction',
            kindKey: shadow.kindKey || 'pii_regex',
            verdict: row.enabled ? 'redact' : 'pass',
            latencyMs: Date.now() - start,
            observeMode: true
        })
    }

    if (!row.enabled) return null
    const patterns = row.config?.patterns
    return Array.isArray(patterns) ? patterns : []
}

export default {
    listDefinitions,
    createCustomDefinition,
    listPolicies,
    upsertPolicy,
    deletePolicy,
    resolveGuardrailAttachment,
    isPromoted,
    recordVerdict,
    evaluate,
    getSummary,
    getActiveRedactionPatterns
}
