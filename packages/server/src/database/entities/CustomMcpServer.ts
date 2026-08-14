/* eslint-disable */
import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'
import { ICustomMcpServer } from '../../Interface'

@Entity()
export class CustomMcpServer implements ICustomMcpServer {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Column({ type: 'text', nullable: true })
    serverUrl?: string

    // 'url' (remote/SSE/streamable-HTTP, uses serverUrl/authConfig) or 'stdio' (local process, uses command/args/env)
    @Column({ default: 'url' })
    transportType: string

    @Column({ nullable: true })
    command?: string

    // JSON-stringified string[]
    @Column({ nullable: true, type: 'text' })
    args?: string

    // Encrypted JSON-stringified Record<string, string> (same encryptCredentialData helper as authConfig)
    @Column({ nullable: true, type: 'text' })
    env?: string

    @Column({ nullable: true })
    iconSrc?: string

    @Column({ nullable: true })
    color?: string

    @Column({ default: 'NONE' })
    authType: string

    @Column({ nullable: true, type: 'text' })
    authConfig?: string

    @Column({ nullable: true, type: 'text', select: false })
    tools?: string

    @Column({ type: 'int', default: 0 })
    toolCount: number

    @Column({ default: 'PENDING' })
    status: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date

    @Column({ nullable: false, type: 'text' })
    workspaceId: string
}
