/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { IGuardrailPolicy } from '../../Interface'

/**
 * Enable/configure state for a policy-type GuardrailCatalogItem, scoped the same way
 * AgentToolPolicy already is: chatflowId='' is the workspace-wide default, a specific chatflowId
 * overrides it for that one agent, most-specific-match-wins, and no matching row means the
 * guardrail is OFF (unlike AgentToolPolicy, which defaults permissive -- there's no "already
 * broken if this ships" risk here since nothing is enforced until an admin opts in).
 */
@Entity({ name: 'guardrail_policy' })
@Index(['workspaceId', 'chatflowId', 'catalogKey'], { unique: true })
export class GuardrailPolicy implements IGuardrailPolicy {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    workspaceId: string

    // '' = workspace-wide default, same sentinel convention as AgentToolPolicy.chatflowId.
    @Column({ nullable: false, type: 'text', default: '' })
    chatflowId: string

    @Column({ nullable: false, type: 'text' })
    catalogKey: string

    @Column({ nullable: false, type: 'boolean', default: false })
    enabled: boolean

    // JSON override of the catalog item's defaultConfig (e.g. a custom keyword/regex list).
    @Column({ nullable: true, type: 'text' })
    config?: string

    @Column({ nullable: true, type: 'text' })
    createdBy?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date
}
