/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { IGuardrailDefinition } from '../../Interface'

export enum GuardrailOrigin {
    SYSTEM = 'system',
    CUSTOM = 'custom'
}

export enum GuardrailPlacement {
    INLINE = 'inline',
    ATTACHED = 'attached',
    FLOW = 'flow'
}

export enum GuardrailFailMode {
    OPEN = 'open',
    CLOSED = 'closed'
}

export enum GuardrailOnFailAction {
    BLOCK = 'block',
    REDACT = 'redact',
    FLAG = 'flag',
    REQUIRE_APPROVAL = 'require_approval'
}

/**
 * Guardrails v2 -- see rules/guardrails-v2/definition-schema.md for the full field rationale.
 * Replaces GuardrailCatalogItem as the source of truth for new code; the old entity/table is
 * untouched and still read directly by the handful of workspace-scoped checks that don't fit
 * this chatflow-scoped model (tool_allowlist, memory_rag_write_validation, audit_log,
 * data_retention_policy -- see rules/guardrails-v2/phase0-audit.md Finding 4).
 *
 * "Only one active row per key" is an app-level invariant (filter deletedAt IS NULL AND
 * supersededByDefinitionId IS NULL), not a DB constraint -- matches how this repo already
 * prefers app-level invariants over exotic constraints, and avoids a partial-unique-index
 * expressed differently per driver.
 */
@Entity({ name: 'guardrail_definition' })
export class GuardrailDefinition implements IGuardrailDefinition {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    key: string

    @Column({ nullable: false, type: 'text' })
    name: string

    @Column({ nullable: false, type: 'text' })
    description: string

    @Column({ nullable: true, type: 'text' })
    icon?: string

    @Column({ nullable: false, type: 'text', default: GuardrailOrigin.SYSTEM })
    origin: GuardrailOrigin

    @Column({ nullable: false, type: 'text', default: 'safety' })
    category: string

    @Column({ nullable: false, type: 'text' })
    kindKey: string

    @Column({ nullable: false, type: 'text', default: GuardrailPlacement.ATTACHED })
    placement: GuardrailPlacement

    // JSON array of node categories/baseClasses this may attach to. Unused by any Phase 1 code
    // path -- no real 'guardrails' anchor exists yet -- present so Phase 2 doesn't need a
    // migration to add it.
    @Column({ nullable: true, type: 'text' })
    allowedHosts?: string

    // JSON: 'pre' | 'post' | 'both'. Same Phase-1-inert status as allowedHosts.
    @Column({ nullable: true, type: 'text' })
    hooks?: string

    // JSON, descriptive only -- not rendered by anything in Phase 1.
    @Column({ nullable: false, type: 'text', default: '{}' })
    paramSchema: string

    @Column({ nullable: false, type: 'text', default: '{}' })
    defaultParams: string

    @Column({ nullable: false, type: 'text', default: GuardrailOnFailAction.FLAG })
    defaultOnFailAction: GuardrailOnFailAction

    @Column({ nullable: false, type: 'text', default: GuardrailFailMode.OPEN })
    defaultFailMode: GuardrailFailMode

    @Column({ nullable: false, type: 'int', default: 5000 })
    defaultTimeoutMs: number

    @Column({ nullable: false, type: 'boolean', default: true })
    defaultObserveMode: boolean

    // JSON array of { framework, control } -- compliance metadata from day one (decision 7),
    // even though the coverage UI is Phase 4.
    @Column({ nullable: true, type: 'text' })
    frameworkRefs?: string

    @Column({ nullable: false, type: 'int', default: 1 })
    version: number

    @Column({ nullable: true, type: 'text' })
    supersededByDefinitionId?: string

    // Null = system/global. Set = workspace-scoped custom definition (no Phase 1 authoring
    // path creates one yet -- field exists for Phase 3).
    @Column({ nullable: true, type: 'text' })
    workspaceId?: string

    @Column({ nullable: true, type: 'text' })
    createdBy?: string

    // First soft-delete column in this codebase -- no @DeleteDateColumn()/boolean-deleted
    // precedent exists anywhere else to follow. See definition-schema.md.
    @Column({ nullable: true, type: 'timestamp' })
    deletedAt?: Date

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date
}
