/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { IAgentToolPolicy } from '../../Interface'

export enum AgentToolPolicyEffect {
    ALLOW = 'allow',
    DENY = 'deny'
}

/**
 * Least-privilege allowlist: may this agent (or the workspace by default) invoke this tool node
 * type at all? Keyed on toolNodeName (e.g. "gmail", "customMCP", "agentAsTool") -- coarse by
 * design. For composite tool nodes like AgentAsTool, this restricts whether the node type may
 * run at all, not which specific downstream target (e.g. which agentflow) it calls -- see
 * AgentToolPolicyService for the matching rule.
 */
@Entity({ name: 'agent_tool_policy' })
@Index(['workspaceId', 'chatflowId', 'toolNodeName'], { unique: true })
export class AgentToolPolicy implements IAgentToolPolicy {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    workspaceId: string

    // Empty string ('') = workspace-wide default for this tool, overridden by any
    // chatflow-specific row. Not nullable -- NULL isn't distinct-safe under a unique index
    // (two NULLs don't collide), so a sentinel is used instead to keep exactly one
    // workspace-wide row per (workspaceId, toolNodeName) enforceable across all DB drivers.
    @Column({ nullable: false, type: 'text', default: '' })
    chatflowId: string

    @Column({ nullable: false, type: 'text' })
    toolNodeName: string

    @Column({ nullable: false, type: 'text', default: AgentToolPolicyEffect.ALLOW })
    effect: AgentToolPolicyEffect

    @Column({ nullable: true, type: 'text' })
    createdBy?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date
}
