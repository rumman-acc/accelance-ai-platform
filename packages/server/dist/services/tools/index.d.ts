import { QueryRunner } from 'typeorm';
import { Tool } from '../../database/entities/Tool';
declare const _default: {
    createTool: (requestBody: any, orgId: string) => Promise<any>;
    deleteTool: (toolId: string, workspaceId: string) => Promise<any>;
    getAllTools: (workspaceId?: string, page?: number, limit?: number) => Promise<Tool[] | {
        data: Tool[];
        total: number;
    }>;
    getToolById: (toolId: string, workspaceId: string) => Promise<any>;
    updateTool: (toolId: string, toolBody: any, workspaceId: string) => Promise<any>;
    importTools: (newTools: Partial<Tool>[], queryRunner?: QueryRunner) => Promise<import("typeorm").InsertResult | undefined>;
};
export default _default;
