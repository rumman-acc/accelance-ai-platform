import { AuditLog } from '../../database/entities/AuditLog';
declare const _default: {
    record: (workspaceId: string, userId: string | undefined, action: string, targetType: string, targetId?: string, metadata?: Record<string, unknown>) => Promise<void>;
    list: (workspaceId: string, limit?: number) => Promise<{
        enabled: boolean;
        rows: AuditLog[];
    }>;
};
export default _default;
