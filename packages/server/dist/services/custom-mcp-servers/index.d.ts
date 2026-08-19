import { ICustomMcpServerResponse } from '../../Interface';
declare const _default: {
    createCustomMcpServer: (requestBody: any, orgId: string) => Promise<any>;
    getAllCustomMcpServers: (workspaceId: string, page?: number, limit?: number) => Promise<{
        serverUrl: string | undefined;
        env: string | undefined;
        id: string;
        name: string;
        transportType: string;
        command?: string;
        args?: string;
        iconSrc?: string;
        color?: string;
        authType: string;
        tools?: string;
        toolCount: number;
        status: string;
        createdDate: Date;
        updatedDate: Date;
        workspaceId: string;
    }[] | {
        data: {
            serverUrl: string | undefined;
            env: string | undefined;
            id: string;
            name: string;
            transportType: string;
            command?: string;
            args?: string;
            iconSrc?: string;
            color?: string;
            authType: string;
            tools?: string;
            toolCount: number;
            status: string;
            createdDate: Date;
            updatedDate: Date;
            workspaceId: string;
        }[];
        total: number;
    }>;
    getCustomMcpServerById: (id: string, workspaceId: string) => Promise<ICustomMcpServerResponse>;
    updateCustomMcpServer: (id: string, requestBody: any, workspaceId: string) => Promise<any>;
    deleteCustomMcpServer: (id: string, workspaceId: string) => Promise<any>;
    authorizeCustomMcpServer: (id: string, workspaceId: string) => Promise<any>;
    getDiscoveredTools: (id: string, workspaceId: string) => Promise<Record<string, any>[]>;
};
export default _default;
