/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { IGuardrailCatalogItem } from '../../Interface'

export enum GuardrailKind {
    NODE = 'node',
    POLICY = 'policy'
}

export enum GuardrailEnforcementStatus {
    ENFORCED = 'enforced',
    PLANNED = 'planned'
}

/**
 * The browsable Guardrails & Compliance catalog -- standard entries are seeded by migration
 * (see the AddGuardrailCatalogItem* migrations), custom entries are created per-workspace via
 * the /guardrails/catalog route. Deliberately DB-backed rather than a hardcoded list, so new
 * standard entries can be added by seeding a row without an engineer editing packages/components
 * and redeploying -- same reasoning already applied to the MCP registry browser / Composio
 * catalog importer.
 *
 * `kind: 'node'` entries map to an existing canvas node type (e.g. Content Moderation ->
 * OpenAIModeration/SimplePromptModeration) -- draggable onto the canvas, detected by scanning a
 * chatflow's flowData for `nodeNames`. `kind: 'policy'` entries have no canvas position; they're
 * enabled/configured via GuardrailPolicy and enforced by the engine wherever relevant (see
 * utils/contentRedaction.ts for the PII-redaction chokepoint).
 *
 * `enforcementStatus: 'planned'` entries are listed for visibility only -- the catalog is honest
 * about what the runtime actually does; a 'planned' entry's policy toggle is disabled in the UI
 * rather than silently doing nothing when turned on.
 */
@Entity({ name: 'guardrail_catalog_item' })
@Index(['key'], { unique: true })
export class GuardrailCatalogItem implements IGuardrailCatalogItem {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    key: string

    @Column({ nullable: false, type: 'text' })
    name: string

    @Column({ nullable: false, type: 'text' })
    description: string

    @Column({ nullable: false, type: 'text', default: GuardrailKind.POLICY })
    kind: GuardrailKind

    @Column({ nullable: false, type: 'text', default: 'guardrail' })
    category: string

    // JSON array of canvas node names this catalog entry maps to, e.g. '["openAIModeration"]'.
    // Only meaningful for kind='node'.
    @Column({ nullable: true, type: 'text' })
    nodeNames?: string

    @Column({ nullable: false, type: 'text', default: GuardrailEnforcementStatus.PLANNED })
    enforcementStatus: GuardrailEnforcementStatus

    // JSON describing the config fields a policy of this catalog entry accepts (e.g. redaction
    // pattern list). Informational for the UI form; not validated server-side beyond JSON.parse.
    @Column({ nullable: true, type: 'text' })
    configSchema?: string

    @Column({ nullable: true, type: 'text' })
    defaultConfig?: string

    @Column({ nullable: false, type: 'boolean', default: true })
    isStandard: boolean

    // Null for platform-wide standard entries (seeded by migration). Set for a workspace's own
    // custom entry -- custom entries are only visible to the workspace that created them.
    @Column({ nullable: true, type: 'text' })
    workspaceId?: string

    @Column({ nullable: true, type: 'text' })
    createdBy?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date
}
