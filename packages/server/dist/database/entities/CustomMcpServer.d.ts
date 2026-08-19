import { ICustomMcpServer } from '../../Interface';
export declare class CustomMcpServer implements ICustomMcpServer {
    id: string;
    name: string;
    serverUrl?: string;
    transportType: string;
    command?: string;
    args?: string;
    env?: string;
    iconSrc?: string;
    color?: string;
    authType: string;
    authConfig?: string;
    tools?: string;
    toolCount: number;
    status: string;
    createdDate: Date;
    updatedDate: Date;
    workspaceId: string;
}
