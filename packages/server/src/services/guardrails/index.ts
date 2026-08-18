import { StatusCodes } from 'http-status-codes'
import { GuardrailCatalogItem, GuardrailKind, GuardrailEnforcementStatus } from '../../database/entities/GuardrailCatalogItem'
import { GuardrailPolicy } from '../../database/entities/GuardrailPolicy'
import { AgentToolPolicy } from '../../database/entities/AgentToolPolicy'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const WORKSPACE_WIDE = ''

/**
 * The one default bundle "Policy Templates" currently applies. Hardcoded rather than
 * user-configurable in this first pass -- a real template picker/editor is a fast-follow, not
 * built here.
 */
const DEFAULT_POLICY_TEMPLATE: { catalogKey: string; enabled: boolean }[] = [{ catalogKey: 'pii_redaction', enabled: true }]

/**
 * Applies DEFAULT_POLICY_TEMPLATE as workspace-wide defaults. Called (a) unconditionally for every
 * newly created workspace (enterprise/services/workspace.service.ts), so new workspaces start with
 * a safe baseline, and (b) retroactively when an existing workspace turns "Policy Templates" on.
 */
const applyDefaultPolicyTemplate = async (workspaceId: string): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailPolicy)
        for (const { catalogKey, enabled } of DEFAULT_POLICY_TEMPLATE) {
            const existing = await repo.findOneBy({ workspaceId, chatflowId: WORKSPACE_WIDE, catalogKey })
            if (existing) {
                existing.enabled = enabled
                await repo.save(existing)
            } else {
                await repo.save(repo.create({ workspaceId, chatflowId: WORKSPACE_WIDE, catalogKey, enabled }))
            }
        }
    } catch (e) {
        console.error('Failed to apply default policy template', e)
    }
}

/**
 * Standard entries (seeded by migration, workspaceId IS NULL) plus this workspace's own custom
 * entries. Custom entries from other workspaces are never returned -- catalog visibility is
 * workspace-scoped even though standard rows are platform-wide.
 */
const listCatalog = async (workspaceId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailCatalogItem)
        return await repo
            .createQueryBuilder('item')
            .where('item.workspaceId IS NULL')
            .orWhere('item.workspaceId = :workspaceId', { workspaceId })
            .orderBy('item.isStandard', 'DESC')
            .addOrderBy('item.name', 'ASC')
            .getMany()
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: guardrailsService.listCatalog - ${getErrorMessage(error)}`
        )
    }
}

const createCustomCatalogItem = async (
    workspaceId: string,
    name: string,
    description: string,
    defaultConfig: Record<string, unknown> | undefined,
    createdBy?: string
) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(GuardrailCatalogItem)
        const key = `custom_${workspaceId}_${Date.now()}`
        const item = repo.create({
            key,
            name,
            description,
            kind: GuardrailKind.POLICY,
            category: 'guardrail',
            enforcementStatus: GuardrailEnforcementStatus.ENFORCED,
            defaultConfig: defaultConfig ? JSON.stringify(defaultConfig) : undefined,
            isStandard: false,
            workspaceId,
            createdBy
        })
        return await repo.save(item)
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: guardrailsService.createCustomCatalogItem - ${getErrorMessage(error)}`
        )
    }
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
        const appServer = getRunningExpressApp()
        const catalogRepo = appServer.AppDataSource.getRepository(GuardrailCatalogItem)
        const catalogItem = await catalogRepo.findOneBy({ key: catalogKey })
        if (!catalogItem) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: guardrailsService.upsertPolicy - unknown catalog key`)
        }
        if (catalogItem.enforcementStatus === 'planned' && enabled) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsService.upsertPolicy - "${catalogItem.name}" is not yet enforced by the runtime and cannot be enabled`
            )
        }

        const repo = appServer.AppDataSource.getRepository(GuardrailPolicy)
        const scopedChatflowId = chatflowId || WORKSPACE_WIDE
        const existing = await repo.findOneBy({ workspaceId, chatflowId: scopedChatflowId, catalogKey })
        const configStr = config ? JSON.stringify(config) : undefined
        let saved: GuardrailPolicy
        if (existing) {
            existing.enabled = enabled
            existing.config = configStr
            saved = await repo.save(existing)
        } else {
            const policy = repo.create({ workspaceId, chatflowId: scopedChatflowId, catalogKey, enabled, config: configStr, createdBy })
            saved = await repo.save(policy)
        }

        // Policy Templates: turning this ON for a workspace retroactively applies the default
        // bundle now, not just "will apply to future new workspaces" (see applyDefaultPolicyTemplate).
        if (catalogKey === 'policy_templates' && scopedChatflowId === WORKSPACE_WIDE && enabled) {
            await applyDefaultPolicyTemplate(workspaceId)
        }
        return saved
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

/**
 * Most-specific-match-wins effective state for one policy-type catalog entry, mirroring
 * AgentToolPolicyService.evaluate() -- except the "no row found" default is OFF, not permissive,
 * since a disabled guardrail isn't a regression the way a silently-blocked tool call would be.
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

    // A policy row with no explicit config override must fall back to the catalog item's
    // defaultConfig -- without this, "enabled" but unconfigured guardrails (e.g. Topic Scoping
    // with no deniedTopics override) would be enabled in name only, enforcing nothing.
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

/**
 * Merged view for the canvas "Guardrails & Compliance" panel: every catalog entry visible to this
 * workspace, its effective enabled/source state (workspace default vs. overridden for this agent),
 * and -- for kind='node' entries -- whether a matching node is actually present in this chatflow's
 * flowData. tool_allowlist is a special case: its state is read from the pre-existing
 * AgentToolPolicy table (which has its own dedicated CRUD at /tool-policy) rather than
 * GuardrailPolicy, so this reads it directly instead of duplicating that table.
 */
const getSummary = async (workspaceId: string, chatflowId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const catalog = await listCatalog(workspaceId)

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

        const toolPolicyRepo = appServer.AppDataSource.getRepository(AgentToolPolicy)
        const toolPolicyCount = await toolPolicyRepo.count({ where: { workspaceId } })

        const items = await Promise.all(
            catalog.map(async (item) => {
                if (item.key === 'tool_allowlist') {
                    return {
                        catalogKey: item.key,
                        name: item.name,
                        description: item.description,
                        kind: item.kind,
                        enforcementStatus: item.enforcementStatus,
                        active: toolPolicyCount > 0,
                        source: toolPolicyCount > 0 ? 'tool-access-policy' : 'none',
                        managedVia: '/tool-policy'
                    }
                }
                if (item.kind === GuardrailKind.NODE) {
                    const nodeNames: string[] = item.nodeNames ? JSON.parse(item.nodeNames) : []
                    const present = nodeNames.some((n) => flowNodeNames.includes(n))
                    return {
                        catalogKey: item.key,
                        name: item.name,
                        description: item.description,
                        kind: item.kind,
                        enforcementStatus: item.enforcementStatus,
                        active: present,
                        source: present ? 'canvas-node' : 'none'
                    }
                }

                const chatflowScoped = await appServer.AppDataSource.getRepository(GuardrailPolicy).findOneBy({
                    workspaceId,
                    chatflowId,
                    catalogKey: item.key
                })
                const workspaceWide = chatflowScoped
                    ? undefined
                    : await appServer.AppDataSource.getRepository(GuardrailPolicy).findOneBy({
                          workspaceId,
                          chatflowId: WORKSPACE_WIDE,
                          catalogKey: item.key
                      })
                const effectiveRow = chatflowScoped ?? workspaceWide
                return {
                    catalogKey: item.key,
                    name: item.name,
                    description: item.description,
                    kind: item.kind,
                    enforcementStatus: item.enforcementStatus,
                    active: !!effectiveRow?.enabled,
                    source: chatflowScoped ? 'overridden-for-this-agent' : workspaceWide ? 'workspace-default' : 'none'
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
 * Called from utilAddChatMessage() on every message save. Returns null (meaning: skip redaction
 * entirely, do not modify content) unless at least one redaction-capable policy -- the standard
 * 'pii_redaction' entry or a custom, non-standard policy-type entry -- is enabled for this
 * workspace/chatflow. When enabled, returns the extra regex patterns (beyond the built-in PII
 * presets baked into redactContent()) to also redact.
 */
const getActiveRedactionPatterns = async (workspaceId: string, chatflowId: string): Promise<string[] | null> => {
    const appServer = getRunningExpressApp()
    const catalog = await listCatalog(workspaceId)
    const candidates = catalog.filter((c) => c.kind === GuardrailKind.POLICY && (c.key === 'pii_redaction' || !c.isStandard))
    const policyRepo = appServer.AppDataSource.getRepository(GuardrailPolicy)

    let anyEnabled = false
    const extraPatterns: string[] = []
    for (const item of candidates) {
        const chatflowScoped = await policyRepo.findOneBy({ workspaceId, chatflowId, catalogKey: item.key })
        const row = chatflowScoped ?? (await policyRepo.findOneBy({ workspaceId, chatflowId: WORKSPACE_WIDE, catalogKey: item.key }))
        if (!row?.enabled) continue
        anyEnabled = true
        try {
            const cfg = row.config ? JSON.parse(row.config) : item.defaultConfig ? JSON.parse(item.defaultConfig) : {}
            if (Array.isArray(cfg?.patterns)) extraPatterns.push(...cfg.patterns)
        } catch {
            // Malformed config -- ignore its extra patterns, built-in presets still apply.
        }
    }
    return anyEnabled ? extraPatterns : null
}

export default {
    listCatalog,
    createCustomCatalogItem,
    listPolicies,
    upsertPolicy,
    deletePolicy,
    evaluate,
    getSummary,
    getActiveRedactionPatterns,
    applyDefaultPolicyTemplate
}
