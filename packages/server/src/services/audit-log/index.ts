import { StatusCodes } from 'http-status-codes'
import { AuditLog } from '../../database/entities/AuditLog'
import { GuardrailPolicy } from '../../database/entities/GuardrailPolicy'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const WORKSPACE_WIDE = ''

/**
 * Self-contained check (queries GuardrailPolicy directly rather than importing
 * services/guardrails) to avoid a circular import -- guardrailsService.upsertPolicy is one of
 * this module's callers.
 */
const isAuditLogEnabled = async (workspaceId: string): Promise<boolean> => {
    const appServer = getRunningExpressApp()
    const row = await appServer.AppDataSource.getRepository(GuardrailPolicy).findOneBy({
        workspaceId,
        chatflowId: WORKSPACE_WIDE,
        catalogKey: 'audit_log'
    })
    return !!row?.enabled
}

/**
 * Writes an audit row only if the 'audit_log' policy is enabled for this workspace -- must never
 * throw or block the action being audited, so failures (including "not enabled") are swallowed.
 */
const record = async (
    workspaceId: string,
    userId: string | undefined,
    action: string,
    targetType: string,
    targetId?: string,
    metadata?: Record<string, unknown>
): Promise<void> => {
    try {
        if (!(await isAuditLogEnabled(workspaceId))) return
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(AuditLog)
        const row = repo.create({
            workspaceId,
            userId,
            action,
            targetType,
            targetId,
            metadata: metadata ? JSON.stringify(metadata) : undefined
        })
        await repo.save(row)
    } catch (e) {
        console.error('Failed to record audit log entry', e)
    }
}

const list = async (workspaceId: string, limit: number = 50) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(AuditLog)
        const [enabled, rows] = await Promise.all([
            isAuditLogEnabled(workspaceId),
            repo.find({ where: { workspaceId }, order: { createdDate: 'DESC' }, take: limit })
        ])
        return { enabled, rows }
    } catch (error) {
        throw new InternalAccelanceError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: auditLogService.list - ${getErrorMessage(error)}`)
    }
}

export default {
    record,
    list
}
