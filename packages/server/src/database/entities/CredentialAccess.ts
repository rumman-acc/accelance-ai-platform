/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'
import { ICredentialAccess } from '../../Interface'

/**
 * Explicit grant: this user may use this credential. Existence of a row (or being the
 * credential's createdBy) is what CredentialAccessService.hasAccess() checks — see that service
 * for how this composes with WorkspaceShared for cross-workspace-shared credentials.
 */
@Entity({ name: 'credential_access' })
@Index(['credentialId', 'userId'], { unique: true })
export class CredentialAccess implements ICredentialAccess {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    credentialId: string

    @Column({ nullable: false, type: 'text' })
    userId: string

    @Column({ nullable: false, type: 'text' })
    workspaceId: string

    @Column({ nullable: true, type: 'text' })
    grantedBy?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date
}
