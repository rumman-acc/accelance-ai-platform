import { DeleteResult } from 'typeorm';
declare const _default: {
    getAllTemplates: () => Promise<any[]>;
    getAllCustomTemplates: (workspaceId?: string) => Promise<any>;
    saveCustomTemplate: (body: any) => Promise<any>;
    deleteCustomTemplate: (templateId: string, workspaceId: string) => Promise<DeleteResult>;
};
export default _default;
