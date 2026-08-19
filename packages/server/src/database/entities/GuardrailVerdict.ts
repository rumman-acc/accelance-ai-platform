/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'
import { IGuardrailVerdict } from '../../Interface'

/**
 * Guardrails v2 -- append-only. The concrete hook build-plan §2.1 requires: "guardrail
 * verdicts must be recorded per chatflowId + nodeId + definitionId from Phase 1. That is the
 * only hook a future mandatory-policy layer needs." Nothing reads this table yet in Phase 1 --
 * it exists so observe-mode data accumulates from day one instead of needing a second
 * migration later to backfill history that was never recorded. Mirrors ToolCallAudit's
 * append-only shape (createdDate only, no updatedDate).
 */
@Entity({ name: 'guardrail_verdict' })
@Index(['workspaceId', 'chatflowId', 'createdDate'])
export class GuardrailVerdict implements IGuardrailVerdict {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    workspaceId: string

    @Column({ nullable: false, type: 'text' })
    chatflowId: string

    // Real host-node canvas id where one exists; '' for flow-scoped checks with no host node.
    @Column({ nullable: false, type: 'text', default: '' })
    nodeId: string

    // Nullable defensively -- definitionKey is the durable join, definitions are never
    // hard-deleted so this should normally resolve.
    @Column({ nullable: true, type: 'text' })
    definitionId?: string

    @Column({ nullable: false, type: 'text' })
    definitionKey: string

    @Column({ nullable: false, type: 'text' })
    kindKey: string

    @Column({ nullable: false, type: 'text' })
    verdict: string

    @Column({ nullable: true, type: 'float' })
    score?: number

    @Column({ nullable: true, type: 'text' })
    reason?: string

    @Column({ nullable: true, type: 'text' })
    evidence?: string

    @Column({ nullable: false, type: 'int' })
    latencyMs: number

    // The mode *at the time of this verdict* -- an attachment's mode can change later, old
    // verdicts shouldn't be reinterpreted retroactively.
    @Column({ nullable: false, type: 'boolean' })
    observeMode: boolean

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date
}
