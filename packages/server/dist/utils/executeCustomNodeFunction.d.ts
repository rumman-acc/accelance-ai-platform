import { DataSource } from 'typeorm';
import { IComponentNodes } from '../Interface';
export declare const executeCustomNodeFunction: ({ appDataSource, componentNodes, data, workspaceId, orgId, canViewVariables }: {
    appDataSource: DataSource;
    componentNodes: IComponentNodes;
    data: any;
    workspaceId?: string;
    orgId?: string;
    canViewVariables?: boolean;
}) => Promise<any>;
