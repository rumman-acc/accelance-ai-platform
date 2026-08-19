"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FALLBACK_TIMEZONE = exports.FALLBACK_CRON_EXPRESSION = exports.canScheduleEnable = exports.isScheduleInputValid = exports.resolveScheduleCron = exports.buildCronFromVisualPicker = exports.validateVisualPickerFields = exports.computeNextRunAt = exports.validateCronExpression = void 0;
const http_status_codes_1 = require("http-status-codes");
const uuid_1 = require("uuid");
const typeorm_1 = require("typeorm");
const ScheduleRecord_1 = require("../../database/entities/ScheduleRecord");
const ScheduleTriggerLog_1 = require("../../database/entities/ScheduleTriggerLog");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const logger_1 = __importDefault(require("../../utils/logger"));
const executions_1 = __importDefault(require("../executions"));
const utils_2 = require("./utils");
var utils_3 = require("./utils");
Object.defineProperty(exports, "validateCronExpression", { enumerable: true, get: function () { return utils_3.validateCronExpression; } });
Object.defineProperty(exports, "computeNextRunAt", { enumerable: true, get: function () { return utils_3.computeNextRunAt; } });
Object.defineProperty(exports, "validateVisualPickerFields", { enumerable: true, get: function () { return utils_3.validateVisualPickerFields; } });
Object.defineProperty(exports, "buildCronFromVisualPicker", { enumerable: true, get: function () { return utils_3.buildCronFromVisualPicker; } });
Object.defineProperty(exports, "resolveScheduleCron", { enumerable: true, get: function () { return utils_3.resolveScheduleCron; } });
Object.defineProperty(exports, "isScheduleInputValid", { enumerable: true, get: function () { return utils_3.isScheduleInputValid; } });
Object.defineProperty(exports, "canScheduleEnable", { enumerable: true, get: function () { return utils_3.canScheduleEnable; } });
/**
 * A fallback cron expression used when the provided one is invalid,
 * to prevent the schedule from being deleted and to allow users
 * to fix the cron expression without losing the schedule record.
 * The beat will skip execution if it detects this fallback expression, and will log an error for visibility.
 */
exports.FALLBACK_CRON_EXPRESSION = '0 0 * * *'; // daily at midnight UTC
exports.FALLBACK_TIMEZONE = 'UTC';
/* Schedule batch size for processing schedules in batches */
const SCHEDULE_BATCH_SIZE = 100;
const createOrUpdateSchedule = async (input) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(ScheduleRecord_1.ScheduleRecord);
        const validation = (0, utils_2.validateCronExpression)(input.cronExpression, input.timezone ?? exports.FALLBACK_TIMEZONE);
        const cronExpression = validation.valid ? input.cronExpression : exports.FALLBACK_CRON_EXPRESSION;
        const timezone = validation.valid ? input.timezone ?? exports.FALLBACK_TIMEZONE : exports.FALLBACK_TIMEZONE;
        // Upsert: find existing record for this target + triggerType
        const existing = await repo.findOne({
            where: {
                targetId: input.targetId,
                triggerType: input.triggerType,
                workspaceId: input.workspaceId
            }
        });
        if (existing) {
            const updateSchedule = new ScheduleRecord_1.ScheduleRecord();
            const bodySchedule = {
                cronExpression,
                timezone
            };
            if (input.enabled !== undefined)
                bodySchedule.enabled = input.enabled;
            if (input.scheduleInputMode !== undefined)
                bodySchedule.scheduleInputMode = input.scheduleInputMode;
            if (input.defaultInput !== undefined)
                bodySchedule.defaultInput = input.defaultInput;
            if (input.defaultForm !== undefined)
                bodySchedule.defaultForm = input.defaultForm;
            if (input.nodeId !== undefined)
                bodySchedule.nodeId = input.nodeId;
            bodySchedule.endDate = input.endDate ?? null;
            bodySchedule.nextRunAt = (0, utils_2.computeNextRunAt)(cronExpression, timezone) ?? null;
            // NOTE: Use assign + merge to update `endDate` and `nextRunAt` even if they are null
            Object.assign(updateSchedule, bodySchedule);
            const merged = repo.merge(existing, updateSchedule);
            const saved = await repo.save(merged);
            logger_1.default.debug(`[ScheduleService]: Updated schedule ${saved.id} for ${input.triggerType}:${input.targetId}`);
            return saved;
        }
        const record = repo.create({
            triggerType: input.triggerType,
            targetId: input.targetId,
            nodeId: input.nodeId,
            cronExpression: cronExpression,
            timezone: timezone,
            enabled: input.enabled !== undefined ? input.enabled : validation.valid, // default to enabled if valid, disabled if invalid
            scheduleInputMode: input.scheduleInputMode,
            defaultInput: input.defaultInput,
            defaultForm: input.defaultForm,
            endDate: input.endDate,
            nextRunAt: (0, utils_2.computeNextRunAt)(cronExpression, timezone) ?? undefined,
            workspaceId: input.workspaceId
        });
        const saved = await repo.save(record);
        logger_1.default.debug(`[ScheduleService]: Created schedule ${saved.id} for ${input.triggerType}:${input.targetId}`);
        return saved;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: scheduleService.createOrUpdateSchedule - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Deletes the schedule record for a given target and trigger type.
 * NOTE: The log should be retained for historical/audit purposes, even if the schedule is deleted.
 */
const deleteScheduleForTarget = async (targetId, triggerType, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(ScheduleRecord_1.ScheduleRecord);
        const record = await repo.findOne({ where: { targetId, triggerType, workspaceId } });
        if (!record)
            return;
        await repo.delete(record.id);
        logger_1.default.debug(`[ScheduleService]: Deleted schedule for ${triggerType}:${targetId}`);
        return record;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: scheduleService.deleteScheduleForTarget - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getEnabledSchedulesBatch = async (skip = 0, take = SCHEDULE_BATCH_SIZE) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        return await appServer.AppDataSource.getRepository(ScheduleRecord_1.ScheduleRecord).find({
            where: { enabled: true },
            order: { createdDate: 'ASC' },
            skip,
            take
        });
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: scheduleService.getEnabledSchedulesBatch - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// ---------------------------------------------------------------------------
// Cron field helpers (used by computeNextRunAt)
// ---------------------------------------------------------------------------
const updateScheduleAfterRun = async (appDataSource, scheduleRecordId, cronExpression, timezone = 'UTC') => {
    try {
        const lastRunAt = new Date();
        const nextRunAt = (0, utils_2.computeNextRunAt)(cronExpression, timezone, lastRunAt) ?? undefined;
        await appDataSource.getRepository(ScheduleRecord_1.ScheduleRecord).update({ id: scheduleRecordId }, { lastRunAt, nextRunAt });
    }
    catch (error) {
        logger_1.default.error(`[ScheduleService]: updateScheduleAfterRun failed for ${scheduleRecordId}: ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Returns the current schedule record and whether it can be enabled,
 * validated against the live flowData (not the stored cron which may be a fallback).
 */
const getScheduleStatus = async (targetId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const record = await appServer.AppDataSource.getRepository(ScheduleRecord_1.ScheduleRecord).findOne({
            where: { targetId, triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, workspaceId }
        });
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOne({
            where: { id: targetId, workspaceId }
        });
        if (!chatflow?.flowData) {
            return { record, canEnable: false, reason: 'Flow not found or has no data' };
        }
        try {
            const parsedFlowData = JSON.parse(chatflow.flowData);
            const startNode = (parsedFlowData.nodes || []).find((n) => n.data?.name === 'startAgentflow');
            const startInputType = startNode?.data?.inputs?.startInputType;
            if (!startNode || startInputType !== 'scheduleInput') {
                return { record, canEnable: false, reason: 'Flow is not configured as a scheduled flow' };
            }
            const inputs = startNode.data.inputs;
            const cronResult = (0, utils_2.resolveScheduleCron)(inputs);
            if (!cronResult.valid) {
                return { record, canEnable: false, reason: cronResult.error || 'Invalid cron expression or timezone' };
            }
            // endDate must be in the future if set
            const endDateValue = inputs.scheduleEndDate || record?.endDate;
            if (endDateValue) {
                const endDate = new Date(endDateValue);
                if (isNaN(endDate.getTime())) {
                    return { record, canEnable: false, reason: 'Invalid end date' };
                }
                if (endDate <= new Date()) {
                    return { record, canEnable: false, reason: 'End date is in the past' };
                }
            }
            // Validate input presence according to the chosen schedule input mode.
            // 'text' requires a non-empty default input; 'form' requires at least one form field; 'none' is always valid.
            const mode = inputs.scheduleInputMode ?? record?.scheduleInputMode;
            if (!mode) {
                return { record, canEnable: false, reason: 'Schedule Input Mode is required' };
            }
            const isInputValidResult = (0, utils_2.isScheduleInputValid)(mode, inputs.scheduleDefaultInput, inputs.scheduleFormInputTypes);
            if (!isInputValidResult) {
                const reason = mode === 'form'
                    ? 'At least one form field must be defined to enable schedule'
                    : 'Default input is required to enable schedule';
                return { record, canEnable: false, reason };
            }
            return { record, canEnable: true };
        }
        catch {
            return { record, canEnable: false, reason: 'Could not parse flow data' };
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: scheduleService.getScheduleStatus - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Toggles the enabled state of a schedule record.
 * When enabling, validates the schedule config first.
 * Caller is responsible for notifying ScheduleBeat after this returns.
 */
const toggleScheduleEnabled = async (targetId, workspaceId, enabled) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(ScheduleRecord_1.ScheduleRecord);
        const record = await repo.findOne({
            where: { targetId, triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, workspaceId }
        });
        if (!record) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'No schedule record found for this flow');
        }
        if (enabled) {
            const status = await getScheduleStatus(targetId, workspaceId);
            if (!status.canEnable) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, status.reason || 'Cannot enable schedule: invalid configuration');
            }
        }
        record.enabled = enabled;
        const saved = await repo.save(record);
        logger_1.default.debug(`[ScheduleService]: Schedule ${record.id} toggled to ${enabled ? 'enabled' : 'disabled'}`);
        return saved;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: scheduleService.toggleScheduleEnabled - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// ─── Log functions ─────────────────────────────────────────────────────────────
const createTriggerLog = async (data) => {
    try {
        const repo = data.appDataSource.getRepository(ScheduleTriggerLog_1.ScheduleTriggerLog);
        const log = repo.create({
            id: (0, uuid_1.v4)(),
            ...data
        });
        return await repo.save(log);
    }
    catch (error) {
        logger_1.default.error(`[ScheduleService]: createTriggerLog failed: ${(0, utils_1.getErrorMessage)(error)}`);
        throw error;
    }
};
const updateTriggerLog = async (appDataSource, logId, update) => {
    try {
        await appDataSource.getRepository(ScheduleTriggerLog_1.ScheduleTriggerLog).update({ id: logId }, update);
    }
    catch (error) {
        logger_1.default.error(`[ScheduleService]: updateTriggerLog failed for ${logId}: ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Returns a paginated list of trigger-log rows for the schedule of a given target
 * (chatflow/agentflow), scoped to the workspace. Newest first.
 */
const getTriggerLogs = async (targetId, workspaceId, filter = {}) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(ScheduleTriggerLog_1.ScheduleTriggerLog);
        const page = Math.max(1, Math.floor(filter.page ?? 1));
        const limit = Math.max(1, Math.min(100, Math.floor(filter.limit ?? 20)));
        const where = { targetId, workspaceId };
        if (filter.status) {
            where.status = Array.isArray(filter.status) && filter.status.length === 1 ? filter.status[0] : filter.status;
        }
        const [data, total] = await repo.findAndCount({
            where: where,
            order: { scheduledAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });
        return { data, total, page, limit };
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: scheduleService.getTriggerLogs - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Deletes trigger-log rows by id, scoped to a workspace + target so a user from one workspace
 * can't delete another's logs. Cascades to the linked Execution rows (and clears
 * ChatMessage.executionId pointers via executionsService.deleteExecutions).
 *
 * @returns counts of deleted logs and executions
 */
const deleteTriggerLogs = async (targetId, workspaceId, logIds) => {
    try {
        if (!Array.isArray(logIds) || logIds.length === 0) {
            return { success: true, deletedLogs: 0, deletedExecutions: 0 };
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(ScheduleTriggerLog_1.ScheduleTriggerLog);
        // Load first so we can extract executionIds before delete (and respect target/workspace scope).
        const logs = await repo.find({ where: { id: (0, typeorm_1.In)(logIds), targetId, workspaceId } });
        if (logs.length === 0) {
            return { success: true, deletedLogs: 0, deletedExecutions: 0 };
        }
        const executionIds = logs.map((l) => l.executionId).filter((id) => !!id);
        const idsToDelete = logs.map((l) => l.id);
        const result = await repo.delete({ id: (0, typeorm_1.In)(idsToDelete) });
        let deletedExecutions = 0;
        if (executionIds.length > 0) {
            const execResult = await executions_1.default.deleteExecutions(executionIds, workspaceId);
            deletedExecutions = execResult.deletedCount ?? 0;
        }
        logger_1.default.debug(`[ScheduleService]: Deleted ${result.affected ?? 0} trigger logs and ${deletedExecutions} executions`);
        return { success: true, deletedLogs: result.affected ?? 0, deletedExecutions };
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: scheduleService.deleteTriggerLogs - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// ─── Visual Picker helpers ──────────────────────────────────────────────────
exports.default = {
    validateCronExpression: utils_2.validateCronExpression,
    validateVisualPickerFields: utils_2.validateVisualPickerFields,
    buildCronFromVisualPicker: utils_2.buildCronFromVisualPicker,
    resolveScheduleCron: utils_2.resolveScheduleCron,
    createOrUpdateSchedule,
    deleteScheduleForTarget,
    getEnabledSchedulesBatch,
    updateScheduleAfterRun,
    computeNextRunAt: utils_2.computeNextRunAt,
    createTriggerLog,
    updateTriggerLog,
    getScheduleStatus,
    toggleScheduleEnabled,
    getTriggerLogs,
    deleteTriggerLogs,
    isScheduleInputValid: utils_2.isScheduleInputValid,
    canScheduleEnable: utils_2.canScheduleEnable
};
//# sourceMappingURL=index.js.map