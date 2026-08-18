/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'
import { IAuditLog } from '../../Interface'

/**
 * Append-only. Only written to when the 'audit_log' GuardrailPolicy is enabled for the
 * workspace (checked by services/audit-log itself, not by callers) -- covers guardrail/tool-policy
 * changes and chatflow deletion in this first pass, not every action platform-wide yet.
 */
@Entity({ name: 'audit_log' })
@Index(['workspaceId', 'createdDate'])
export class AuditLog implements IAuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    workspaceId: string

    @Column({ nullable: true, type: 'text' })
    userId?: string

    @Column({ nullable: false, type: 'text' })
    action: string

    @Column({ nullable: false, type: 'text' })
    targetType: string

    @Column({ nullable: true, type: 'text' })
    targetId?: string

    @Column({ nullable: true, type: 'text' })
    metadata?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date
}
