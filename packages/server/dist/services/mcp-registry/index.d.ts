declare const _default: {
    searchServers: (query: string, cursor?: string) => Promise<{
        servers: any;
        nextCursor: any;
    }>;
    importServer: (workspaceId: string, orgId: string, registryId: string, transport: "remote" | "stdio", headerValues: Record<string, string> | undefined, envValues: Record<string, string> | undefined) => Promise<any>;
};
export default _default;
