import { Credential } from '../../database/entities/Credential';
declare const _default: {
    createCredential: (requestBody: any) => Promise<Credential>;
    deleteCredentials: (credentialId: string, workspaceId: string) => Promise<any>;
    getAllCredentials: (paramCredentialName: any, workspaceId: string) => Promise<any[]>;
    getCredentialById: (credentialId: string, workspaceId: string) => Promise<any>;
    revealCredentialById: (credentialId: string, workspaceId: string) => Promise<any>;
    updateCredential: (credentialId: string, requestBody: any, workspaceId: string) => Promise<any>;
};
export default _default;
