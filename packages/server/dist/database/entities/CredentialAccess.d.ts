import { ICredentialAccess } from '../../Interface';
/**
 * Explicit grant: this user may use this credential. Existence of a row (or being the
 * credential's createdBy) is what CredentialAccessService.hasAccess() checks — see that service
 * for how this composes with WorkspaceShared for cross-workspace-shared credentials.
 */
export declare class CredentialAccess implements ICredentialAccess {
    id: string;
    credentialId: string;
    userId: string;
    workspaceId: string;
    grantedBy?: string;
    createdDate: Date;
}
