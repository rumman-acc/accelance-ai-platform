declare const _default: {
    searchActions: (credentialId: string, workspaceId: string, query: string) => Promise<any>;
    listConnections: (credentialId: string, workspaceId: string, appName: string) => Promise<any>;
    importAction: (credentialId: string, workspaceId: string, orgId: string, actionName: string, connectedAccountId: string | undefined) => Promise<any>;
};
export default _default;
