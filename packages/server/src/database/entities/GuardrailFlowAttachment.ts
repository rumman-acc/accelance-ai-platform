/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { IGuardrailFlowAttachment } from '../../Interface'

/**
 * Guardrails v2 -- the storage for attached/flow-placement guardrail instances. See
 * rules/guardrails-v2/definition-schema.md and the implementation plan's "Design choice"
 * section for why this is a normalized table rather than a flowData rewrite: it's the same
 * "merge at read time" pattern the plan already asks for on the node palette, applied to
 * per-chatflow attachments -- not a stopgap to be converted away from in Phase 2.
 *
 * Always a real chatflowId -- no '' workspace-wide sentinel. A workspace-wide GuardrailPolicy
 * toggle becomes N per-chatflow rows at backfill time; this is how the removal of
 * workspace-wide defaults is enforced structurally, not just by deleting a UI control.
 *
 * observeMode defaulting true and never being flipped to false anywhere in Phase 1 code is
 * the sole gate that keeps every backfilled attachment in shadow/record-only mode -- see
 * rules/guardrails-v2/reconciliation.md's "one caveat" section for why this matters
 * specifically for egress_filtering/prompt_injection_defense.
 */
@Entity({ name: 'guardrail_flow_attachment' })
@Index(['chatflowId', 'definitionKey'], { unique: true })
export class GuardrailFlowAttachment implements IGuardrailFlowAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    workspaceId: string

    @Column({ nullable: false, type: 'text' })
    chatflowId: string

    @Column({ nullable: false, type: 'text' })
    definitionId: string

    // Denormalized -- keeps evaluation working even if the definition is later soft-deleted.
    @Column({ nullable: false, type: 'text' })
    definitionKey: string

    @Column({ nullable: false, type: 'text' })
    kindKey: string

    // Snapshotted at attach time, never a live reference to the definition's current params.
    @Column({ nullable: false, type: 'text' })
    paramsSnapshot: string

    @Column({ nullable: false, type: 'text' })
    onFailAction: string

    @Column({ nullable: false, type: 'text' })
    failMode: string

    @Column({ nullable: false, type: 'int' })
    timeoutMs: number

    @Column({ nullable: false, type: 'boolean', default: true })
    observeMode: boolean

    @Column({ nullable: true, type: 'text' })
    createdBy?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date
}
