import cron from 'node-cron'
import { LessThan } from 'typeorm'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import { GuardrailPolicy } from '../database/entities/GuardrailPolicy'
import { ChatFlow } from '../database/entities/ChatFlow'
import { ChatMessage } from '../database/entities/ChatMessage'
import { Execution } from '../database/entities/Execution'
import { ToolCallAudit } from '../database/entities/ToolCallAudit'
import logger from '../utils/logger'

const WORKSPACE_WIDE = ''

const daysAgo = (days: number): Date => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d
}

/**
 * Data Retention Policy guardrail: for every workspace with the policy enabled, deletes chat
 * messages / executions / tool-call-audit rows older than the configured window. Runs once daily
 * via node-cron directly (not the ScheduleRecord/ScheduleBeat system, which is for user-created
 * flow schedules, not this kind of system-level compliance job) -- simplest correct choice for a
 * single, always-on job.
 */
export const runRetentionCleanup = async (): Promise<void> => {
    const appServer = getRunningExpressApp()
    const dataSource = appServer.AppDataSource

    const enabledPolicies = await dataSource
        .getRepository(GuardrailPolicy)
        .findBy({ chatflowId: WORKSPACE_WIDE, catalogKey: 'data_retention_policy', enabled: true })

    for (const policy of enabledPolicies) {
        try {
            const config = policy.config ? JSON.parse(policy.config) : {}
            const chatMessageDays: number = typeof config.chatMessageRetentionDays === 'number' ? config.chatMessageRetentionDays : 90
            const executionDays: number = typeof config.executionRetentionDays === 'number' ? config.executionRetentionDays : 90
            const toolCallAuditDays: number = typeof config.toolCallAuditRetentionDays === 'number' ? config.toolCallAuditRetentionDays : 90

            const workspaceChatflowIds = (
                await dataSource.getRepository(ChatFlow).find({ where: { workspaceId: policy.workspaceId }, select: ['id'] })
            ).map((cf) => cf.id)

            if (workspaceChatflowIds.length) {
                const cmResult = await dataSource
                    .getRepository(ChatMessage)
                    .createQueryBuilder()
                    .delete()
                    .where('chatflowid IN (:...ids)', { ids: workspaceChatflowIds })
                    .andWhere('createdDate < :cutoff', { cutoff: daysAgo(chatMessageDays) })
                    .execute()
                logger.info(
                    `[server]: [retention/${policy.workspaceId}]: deleted ${
                        cmResult.affected ?? 0
                    } ChatMessage row(s) older than ${chatMessageDays}d`
                )
            }

            const execResult = await dataSource.getRepository(Execution).delete({
                workspaceId: policy.workspaceId,
                createdDate: LessThan(daysAgo(executionDays))
            })
            logger.info(
                `[server]: [retention/${policy.workspaceId}]: deleted ${
                    execResult.affected ?? 0
                } Execution row(s) older than ${executionDays}d`
            )

            const auditResult = await dataSource.getRepository(ToolCallAudit).delete({
                workspaceId: policy.workspaceId,
                createdDate: LessThan(daysAgo(toolCallAuditDays))
            })
            logger.info(
                `[server]: [retention/${policy.workspaceId}]: deleted ${
                    auditResult.affected ?? 0
                } ToolCallAudit row(s) older than ${toolCallAuditDays}d`
            )
        } catch (e) {
            logger.error(`[server]: [retention/${policy.workspaceId}]: cleanup failed`, e)
        }
    }
}

export const startRetentionCleanupJob = (): void => {
    cron.schedule('0 3 * * *', () => {
        runRetentionCleanup().catch((e) => logger.error('[server]: [retention]: scheduled run failed', e))
    })
    logger.info('[server]: [retention]: daily cleanup job registered (03:00 server time)')
}
