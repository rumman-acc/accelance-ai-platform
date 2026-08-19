"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRetentionCleanupJob = exports.runRetentionCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const typeorm_1 = require("typeorm");
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const GuardrailPolicy_1 = require("../database/entities/GuardrailPolicy");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const ChatMessage_1 = require("../database/entities/ChatMessage");
const Execution_1 = require("../database/entities/Execution");
const ToolCallAudit_1 = require("../database/entities/ToolCallAudit");
const logger_1 = __importDefault(require("../utils/logger"));
const WORKSPACE_WIDE = '';
const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};
/**
 * Data Retention Policy guardrail: for every workspace with the policy enabled, deletes chat
 * messages / executions / tool-call-audit rows older than the configured window. Runs once daily
 * via node-cron directly (not the ScheduleRecord/ScheduleBeat system, which is for user-created
 * flow schedules, not this kind of system-level compliance job) -- simplest correct choice for a
 * single, always-on job.
 */
const runRetentionCleanup = async () => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const dataSource = appServer.AppDataSource;
    const enabledPolicies = await dataSource
        .getRepository(GuardrailPolicy_1.GuardrailPolicy)
        .findBy({ chatflowId: WORKSPACE_WIDE, catalogKey: 'data_retention_policy', enabled: true });
    for (const policy of enabledPolicies) {
        try {
            const config = policy.config ? JSON.parse(policy.config) : {};
            const chatMessageDays = typeof config.chatMessageRetentionDays === 'number' ? config.chatMessageRetentionDays : 90;
            const executionDays = typeof config.executionRetentionDays === 'number' ? config.executionRetentionDays : 90;
            const toolCallAuditDays = typeof config.toolCallAuditRetentionDays === 'number' ? config.toolCallAuditRetentionDays : 90;
            const workspaceChatflowIds = (await dataSource.getRepository(ChatFlow_1.ChatFlow).find({ where: { workspaceId: policy.workspaceId }, select: ['id'] })).map((cf) => cf.id);
            if (workspaceChatflowIds.length) {
                const cmResult = await dataSource
                    .getRepository(ChatMessage_1.ChatMessage)
                    .createQueryBuilder()
                    .delete()
                    .where('chatflowid IN (:...ids)', { ids: workspaceChatflowIds })
                    .andWhere('createdDate < :cutoff', { cutoff: daysAgo(chatMessageDays) })
                    .execute();
                logger_1.default.info(`[server]: [retention/${policy.workspaceId}]: deleted ${cmResult.affected ?? 0} ChatMessage row(s) older than ${chatMessageDays}d`);
            }
            const execResult = await dataSource.getRepository(Execution_1.Execution).delete({
                workspaceId: policy.workspaceId,
                createdDate: (0, typeorm_1.LessThan)(daysAgo(executionDays))
            });
            logger_1.default.info(`[server]: [retention/${policy.workspaceId}]: deleted ${execResult.affected ?? 0} Execution row(s) older than ${executionDays}d`);
            const auditResult = await dataSource.getRepository(ToolCallAudit_1.ToolCallAudit).delete({
                workspaceId: policy.workspaceId,
                createdDate: (0, typeorm_1.LessThan)(daysAgo(toolCallAuditDays))
            });
            logger_1.default.info(`[server]: [retention/${policy.workspaceId}]: deleted ${auditResult.affected ?? 0} ToolCallAudit row(s) older than ${toolCallAuditDays}d`);
        }
        catch (e) {
            logger_1.default.error(`[server]: [retention/${policy.workspaceId}]: cleanup failed`, e);
        }
    }
};
exports.runRetentionCleanup = runRetentionCleanup;
const startRetentionCleanupJob = () => {
    node_cron_1.default.schedule('0 3 * * *', () => {
        (0, exports.runRetentionCleanup)().catch((e) => logger_1.default.error('[server]: [retention]: scheduled run failed', e));
    });
    logger_1.default.info('[server]: [retention]: daily cleanup job registered (03:00 server time)');
};
exports.startRetentionCleanupJob = startRetentionCleanupJob;
//# sourceMappingURL=RetentionCleanup.js.map