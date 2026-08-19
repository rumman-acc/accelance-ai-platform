"use strict";
/**
 * ScheduleExecutor
 *
 * Shared execution logic for scheduled agentflow jobs. Used by both
 * ScheduleBeat (non-queue / node-cron mode) and ScheduleQueue (BullMQ mode)
 * so that validation, execution, logging, and post-run updates live in one place.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeScheduleJob = executeScheduleJob;
const Interface_1 = require("../Interface");
const ScheduleRecord_1 = require("../database/entities/ScheduleRecord");
const ScheduleTriggerLog_1 = require("../database/entities/ScheduleTriggerLog");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const workspace_entity_1 = require("../enterprise/database/entities/workspace.entity");
const organization_entity_1 = require("../enterprise/database/entities/organization.entity");
const buildAgentflow_1 = require("../utils/buildAgentflow");
const quotaUsage_1 = require("../utils/quotaUsage");
const schedule_1 = __importDefault(require("../services/schedule"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
const organizationAnalytics_1 = require("../enterprise/utils/organizationAnalytics");
// ─── Public API ────────────────────────────────────────────────────────────────
/**
 * Validate and execute a single scheduled agentflow job.
 *
 * Pipeline:
 *  1. Load ScheduleRecord from DB
 *  2. Check enabled / endDate / defaultInput / nextRunAt  →  SKIPPED if invalid
 *  3. Create RUNNING trigger log
 *  4. Load ChatFlow, build input, execute agentflow
 *  5. Update trigger log (SUCCEEDED / FAILED)
 *  6. Update schedule after run (lastRunAt, nextRunAt)
 *
 * @returns The agentflow execution result, or `undefined` if skipped.
 */
async function executeScheduleJob(ctx, scheduleRecordId, callbacks) {
    const scheduledAt = new Date();
    const { appDataSource } = ctx;
    // ── 1. Load & validate record ──────────────────────────────────────────
    const scheduleRecord = await appDataSource.getRepository(ScheduleRecord_1.ScheduleRecord).findOneBy({ id: scheduleRecordId });
    // If the record is missing entirely, log and skip without creating a trigger log.
    if (!scheduleRecord) {
        logger_1.default.warn(`[ScheduleExecutor]: Schedule ${scheduleRecordId} not found, skipping`);
        await callbacks?.onRecordNotFoundOrDisabled?.(scheduleRecordId);
        return undefined;
    }
    // If the record exists but is disabled, record a SKIPPED trigger log with proper attribution.
    if (!scheduleRecord.enabled) {
        logger_1.default.warn(`[ScheduleExecutor]: Schedule ${scheduleRecordId} disabled, skipping`);
        await callbacks?.onRecordNotFoundOrDisabled?.(scheduleRecordId);
        await schedule_1.default.createTriggerLog({
            appDataSource,
            scheduleRecordId,
            triggerType: scheduleRecord.triggerType ?? ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
            targetId: scheduleRecord.targetId,
            status: ScheduleTriggerLog_1.ScheduleTriggerStatus.SKIPPED,
            scheduledAt,
            workspaceId: scheduleRecord.workspaceId
        });
        return undefined;
    }
    // ── 2. End-date / input validation ─────────────────────────────────────
    const isInputValid = scheduleRecord.scheduleInputMode === 'text'
        ? schedule_1.default.isScheduleInputValid(scheduleRecord.scheduleInputMode, scheduleRecord.defaultInput)
        : true;
    if ((scheduleRecord.endDate && scheduledAt >= scheduleRecord.endDate) || !isInputValid) {
        logger_1.default.debug(`[ScheduleExecutor]: Schedule ${scheduleRecordId} has passed end date or invalid input, disabling`);
        await callbacks?.onRecordExpiredOrInvalid?.(scheduleRecord);
        await schedule_1.default.createTriggerLog({
            appDataSource,
            scheduleRecordId,
            triggerType: scheduleRecord.triggerType ?? ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
            targetId: scheduleRecord.targetId,
            status: ScheduleTriggerLog_1.ScheduleTriggerStatus.SKIPPED,
            scheduledAt,
            workspaceId: scheduleRecord.workspaceId
        });
        return undefined;
    }
    // ── 3. nextRunAt guard ─────────────────────────────────────────────────
    if (scheduleRecord.nextRunAt && scheduleRecord.nextRunAt > scheduledAt) {
        logger_1.default.debug(`[ScheduleExecutor]: Scheduled time ${scheduledAt.toISOString()} is before nextRunAt ` +
            `${scheduleRecord.nextRunAt.toISOString()} for schedule ${scheduleRecordId}, skipping`);
        await schedule_1.default.createTriggerLog({
            appDataSource,
            scheduleRecordId,
            triggerType: scheduleRecord.triggerType ?? ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
            targetId: scheduleRecord.targetId,
            status: ScheduleTriggerLog_1.ScheduleTriggerStatus.SKIPPED,
            scheduledAt,
            workspaceId: scheduleRecord.workspaceId
        });
        return undefined;
    }
    // ── 4. Execute ─────────────────────────────────────────────────────────
    return _executeAgentflow(ctx, scheduleRecord, scheduledAt);
}
// ─── Internal ──────────────────────────────────────────────────────────────────
async function _executeAgentflow(ctx, record, scheduledAt) {
    const { appDataSource, componentNodes, telemetry, cachePool, usageCacheManager, sseStreamer, identityManager } = ctx;
    const startTime = Date.now();
    const log = await schedule_1.default.createTriggerLog({
        appDataSource,
        scheduleRecordId: record.id,
        triggerType: record.triggerType,
        targetId: record.targetId,
        status: ScheduleTriggerLog_1.ScheduleTriggerStatus.RUNNING,
        scheduledAt,
        workspaceId: record.workspaceId
    });
    try {
        const chatflow = await appDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({ id: record.targetId });
        if (!chatflow)
            throw new Error(`ChatFlow ${record.targetId} not found`);
        const isAgentFlow = chatflow.type === 'AGENTFLOW';
        if (!isAgentFlow)
            throw new Error(`ChatFlow ${record.targetId} is not of type AGENTFLOW`);
        const workspaceId = chatflow.workspaceId ?? record.workspaceId;
        const workspace = await appDataSource.getRepository(workspace_entity_1.Workspace).findOneBy({ id: workspaceId });
        if (!workspace)
            throw new Error(`Workspace ${workspaceId} not found`);
        const org = await appDataSource.getRepository(organization_entity_1.Organization).findOneBy({ id: workspace.organizationId });
        if (!org)
            throw new Error(`Organization ${workspace.organizationId} not found`);
        const orgId = org.id;
        const subscriptionId = org.subscriptionId;
        const productId = await identityManager.getProductIdFromSubscription(subscriptionId);
        chatflow.analytic = (0, organizationAnalytics_1.mergeAnalyticsConfig)(org.analytic, chatflow.analytic);
        await (0, quotaUsage_1.checkPredictions)(org.id, subscriptionId, usageCacheManager);
        const chatId = (0, uuid_1.v4)();
        const incomingInput = { chatId, streaming: false };
        if (record.scheduleInputMode === 'form') {
            try {
                incomingInput.form = record.defaultForm ? JSON.parse(record.defaultForm) : {};
            }
            catch (e) {
                logger_1.default.warn(`[ScheduleExecutor]: schedule ${record.id} defaultForm is not valid JSON, falling back to {}`);
                incomingInput.form = {};
            }
        }
        else if (record.scheduleInputMode === 'none') {
            // Use a single-space sentinel rather than an empty string, since some models do accept whitespace characters.
            incomingInput.question = ' ';
        }
        else {
            incomingInput.question = record.defaultInput;
        }
        const result = await (0, buildAgentflow_1.executeAgentFlow)({
            componentNodes,
            incomingInput,
            chatflow,
            chatId,
            appDataSource,
            telemetry,
            cachePool,
            usageCacheManager,
            sseStreamer,
            baseURL: process.env.APP_URL ?? '',
            isInternal: true,
            chatType: Interface_1.ChatType.SCHEDULED,
            orgId,
            workspaceId,
            subscriptionId,
            productId
        });
        const elapsedTimeMs = Date.now() - startTime;
        const executionId = result && typeof result === 'object' && 'executionId' in result ? result.executionId : undefined;
        await schedule_1.default.updateTriggerLog(appDataSource, log.id, {
            status: ScheduleTriggerLog_1.ScheduleTriggerStatus.SUCCEEDED,
            elapsedTimeMs,
            executionId
        });
        await (0, quotaUsage_1.updatePredictionsUsage)(orgId, subscriptionId, workspaceId, usageCacheManager);
        await schedule_1.default.updateScheduleAfterRun(appDataSource, record.id, record.cronExpression, record.timezone ?? 'UTC');
        logger_1.default.debug(`[ScheduleExecutor]: Completed schedule ${record.id} (${elapsedTimeMs}ms)`);
        return result;
    }
    catch (error) {
        const elapsedTimeMs = Date.now() - startTime;
        const errMsg = error instanceof Error ? error.message : String(error);
        await schedule_1.default.updateTriggerLog(appDataSource, log.id, {
            status: ScheduleTriggerLog_1.ScheduleTriggerStatus.FAILED,
            elapsedTimeMs,
            error: errMsg
        });
        logger_1.default.error(`[ScheduleExecutor]: Schedule ${record.id} failed: ${errMsg}`);
        throw error;
    }
}
//# sourceMappingURL=ScheduleExecutor.js.map