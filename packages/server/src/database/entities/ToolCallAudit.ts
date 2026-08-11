/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'
import { IToolCallAudit } from '../../Interface'

export enum ToolCallDecision {
    ALLOWED = 'allowed',
    DENIED = 'denied'
}

/**
 * One row per tool invocation attempt, written by wrapToolWithPolicy() (accelance-components'
 * toolPolicy.ts) at both enforcement chokepoints. Not linked to a specific Execution row yet --
 * that would need an executionId threaded through the options bag the same way Phase 0 threaded
 * userId; left for a follow-up rather than expanding this pass further.
 */
@Entity({ name: 'tool_call_audit' })
@Index(['workspaceId', 'chatflowId'])
export class ToolCallAudit implements IToolCallAudit {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    workspaceId: string

    @Column({ nullable: false, type: 'text' })
    chatflowId: string

    @Column({ nullable: true, type: 'text' })
    userId?: string

    @Column({ nullable: false, type: 'text' })
    toolNodeName: string

    @Column({ nullable: true, type: 'text' })
    credentialId?: string

    @Column({ nullable: false, type: 'text' })
    decision: ToolCallDecision

    @Column({ nullable: true, type: 'text' })
    reason?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date
}
