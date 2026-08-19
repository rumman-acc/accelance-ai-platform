import { CredentialAccess } from '../../database/entities/CredentialAccess';
declare const _default: {
    hasAccess: (userId: string, credentialId: string) => Promise<boolean>;
    getCredentialAccessWarnings: (chatflowId: string, workspaceId: string, userId?: string) => Promise<{
        nodeId: string;
        nodeLabel: string;
        credentialId: string;
    }[]>;
    listAccessForCredential: (credentialId: string, workspaceId: string) => Promise<CredentialAccess[]>;
    grantAccess: (credentialId: string, userId: string, workspaceId: string, grantedBy?: string) => Promise<CredentialAccess>;
    revokeAccess: (credentialId: string, userId: string, workspaceId: string) => Promise<import("typeorm").DeleteResult>;
};
export default _default;
