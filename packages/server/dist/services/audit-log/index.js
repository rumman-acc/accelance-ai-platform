"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const AuditLog_1 = require("../../database/entities/AuditLog");
const GuardrailPolicy_1 = require("../../database/entities/GuardrailPolicy");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const WORKSPACE_WIDE = '';
/**
 * Self-contained check (queries GuardrailPolicy directly rather than importing
 * services/guardrails) to avoid a circular import -- guardrailsService.upsertPolicy is one of
 * this module's callers.
 */
const isAuditLogEnabled = async (workspaceId) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const row = await appServer.AppDataSource.getRepository(GuardrailPolicy_1.GuardrailPolicy).findOneBy({
        workspaceId,
        chatflowId: WORKSPACE_WIDE,
        catalogKey: 'audit_log'
    });
    return !!row?.enabled;
};
/**
 * Writes an audit row only if the 'audit_log' policy is enabled for this workspace -- must never
 * throw or block the action being audited, so failures (including "not enabled") are swallowed.
 */
const record = async (workspaceId, userId, action, targetType, targetId, metadata) => {
    try {
        if (!(await isAuditLogEnabled(workspaceId)))
            return;
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(AuditLog_1.AuditLog);
        const row = repo.create({
            workspaceId,
            userId,
            action,
            targetType,
            targetId,
            metadata: metadata ? JSON.stringify(metadata) : undefined
        });
        await repo.save(row);
    }
    catch (e) {
        console.error('Failed to record audit log entry', e);
    }
};
const list = async (workspaceId, limit = 50) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(AuditLog_1.AuditLog);
        const [enabled, rows] = await Promise.all([
            isAuditLogEnabled(workspaceId),
            repo.find({ where: { workspaceId }, order: { createdDate: 'DESC' }, take: limit })
        ]);
        return { enabled, rows };
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: auditLogService.list - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    record,
    list
};
//# sourceMappingURL=index.js.map