"use strict";
/**
 * Unit tests for schedule service (index.ts) — server-side / DB logic.
 * All TypeORM repositories and external dependencies are mocked so no real
 * database or Express app is required.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Infrastructure mocks ─────────────────────────────────────────────────────
const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    merge: jest.fn()
};
const mockAppDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepo)
};
const mockAppServer = {
    AppDataSource: mockAppDataSource
};
jest.mock('../../database/entities/ScheduleRecord', () => ({
    ScheduleRecord: class ScheduleRecord {
    },
    ScheduleTriggerType: { AGENTFLOW: 'AGENTFLOW' }
}));
jest.mock('../../database/entities/ScheduleTriggerLog', () => ({
    ScheduleTriggerLog: class ScheduleTriggerLog {
    },
    ScheduleTriggerStatus: {
        QUEUED: 'QUEUED',
        RUNNING: 'RUNNING',
        SUCCEEDED: 'SUCCEEDED',
        FAILED: 'FAILED',
        SKIPPED: 'SKIPPED'
    }
}));
jest.mock('../../database/entities/ChatFlow', () => ({ ChatFlow: class ChatFlow {
    } }));
jest.mock('../../errors/internalAccelanceError', () => ({
    InternalAccelanceError: class InternalAccelanceError extends Error {
        constructor(statusCode, message) {
            super(message);
            this.statusCode = statusCode;
            this.name = 'InternalAccelanceError';
        }
    }
}));
jest.mock('../../errors/utils', () => ({ getErrorMessage: (e) => String(e) }));
jest.mock('../../utils/getRunningExpressApp', () => ({ getRunningExpressApp: jest.fn().mockReturnValue(mockAppServer) }));
jest.mock('../executions', () => ({
    __esModule: true,
    default: {
        deleteExecutions: jest.fn().mockResolvedValue({ success: true, deletedCount: 0 })
    }
}));
jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: { debug: jest.fn(), error: jest.fn(), info: jest.fn() }
}));
// ─── Imports (after mocks) ────────────────────────────────────────────────────
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const ScheduleRecord_1 = require("../../database/entities/ScheduleRecord");
const ScheduleTriggerLog_1 = require("../../database/entities/ScheduleTriggerLog");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const index_1 = __importDefault(require("./index"));
// Expose the typed mock for convenience
const mockGetApp = getRunningExpressApp_1.getRunningExpressApp;
// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Build a minimal ScheduleRecord-like object for tests */
const makeRecord = (overrides = {}) => ({
    id: 'rec-1',
    targetId: 'flow-1',
    triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
    cronExpression: '* * * * *',
    timezone: 'UTC',
    enabled: true,
    workspaceId: 'ws-1',
    scheduleInputMode: 'text',
    defaultInput: 'hello',
    nodeId: undefined,
    endDate: undefined,
    nextRunAt: undefined,
    ...overrides
});
/** Build flowData JSON with a scheduleInput Start node */
const makeScheduleFlowData = (inputs = {}) => JSON.stringify({
    nodes: [
        {
            id: 'start-0',
            data: {
                name: 'startAgentflow',
                inputs: {
                    startInputType: 'scheduleInput',
                    scheduleCronExpression: '* * * * *',
                    scheduleDefaultInput: 'hello',
                    ...inputs
                }
            }
        }
    ]
});
beforeEach(() => {
    jest.clearAllMocks();
    mockGetApp.mockReturnValue(mockAppServer);
    mockAppDataSource.getRepository.mockReturnValue(mockRepo);
});
// ─── createOrUpdateSchedule ───────────────────────────────────────────────────
describe('createOrUpdateSchedule', () => {
    const baseInput = {
        triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
        targetId: 'flow-1',
        cronExpression: '0 9 * * 1-5',
        timezone: 'UTC',
        workspaceId: 'ws-1',
        scheduleInputMode: 'text',
        defaultInput: 'Run daily job'
    };
    it('creates a new record when none exists', async () => {
        const saved = makeRecord();
        mockRepo.findOne.mockResolvedValue(null);
        mockRepo.create.mockReturnValue(saved);
        mockRepo.save.mockResolvedValue(saved);
        const result = await index_1.default.createOrUpdateSchedule(baseInput);
        expect(mockRepo.findOne).toHaveBeenCalledWith({
            where: { targetId: 'flow-1', triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, workspaceId: 'ws-1' }
        });
        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            cronExpression: '0 9 * * 1-5',
            timezone: 'UTC',
            targetId: 'flow-1',
            workspaceId: 'ws-1',
            enabled: true // valid cron → default enabled
        }));
        expect(mockRepo.save).toHaveBeenCalledWith(saved);
        expect(result).toBe(saved);
    });
    it('updates an existing record when one exists', async () => {
        const existing = makeRecord();
        const saved = { ...existing, cronExpression: '0 9 * * 1-5' };
        mockRepo.findOne.mockResolvedValue(existing);
        mockRepo.merge.mockReturnValue(saved);
        mockRepo.save.mockResolvedValue(saved);
        const result = await index_1.default.createOrUpdateSchedule(baseInput);
        expect(mockRepo.create).not.toHaveBeenCalled();
        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ cronExpression: '0 9 * * 1-5' }));
        expect(result).toBe(saved);
    });
    it('falls back to FALLBACK_CRON_EXPRESSION when cron is invalid', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        const saved = makeRecord({ cronExpression: '0 0 * * *' });
        mockRepo.create.mockReturnValue(saved);
        mockRepo.save.mockResolvedValue(saved);
        await index_1.default.createOrUpdateSchedule({ ...baseInput, cronExpression: 'not-valid' });
        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            cronExpression: '0 0 * * *', // fallback
            enabled: false // invalid cron → default disabled
        }));
    });
    it('respects explicit enabled=false even for a valid cron', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        const saved = makeRecord({ enabled: false });
        mockRepo.create.mockReturnValue(saved);
        mockRepo.save.mockResolvedValue(saved);
        await index_1.default.createOrUpdateSchedule({ ...baseInput, enabled: false });
        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    });
    it('re-throws InternalAccelanceError from the repo', async () => {
        const err = new internalAccelanceError_1.InternalAccelanceError(500, 'db error');
        mockRepo.findOne.mockRejectedValue(err);
        await expect(index_1.default.createOrUpdateSchedule(baseInput)).rejects.toThrow('db error');
    });
    it('wraps unexpected errors in InternalAccelanceError', async () => {
        mockRepo.findOne.mockRejectedValue(new Error('unexpected'));
        await expect(index_1.default.createOrUpdateSchedule(baseInput)).rejects.toMatchObject({
            statusCode: 500
        });
    });
});
// ─── deleteScheduleForTarget ──────────────────────────────────────────────────
describe('deleteScheduleForTarget', () => {
    it('deletes the record and returns it when found', async () => {
        const record = makeRecord();
        mockRepo.findOne.mockResolvedValue(record);
        mockRepo.delete.mockResolvedValue(undefined);
        const result = await index_1.default.deleteScheduleForTarget('flow-1', ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, 'ws-1');
        expect(mockRepo.delete).toHaveBeenCalledWith('rec-1');
        expect(result).toBe(record);
    });
    it('returns undefined without deleting when no record exists', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        const result = await index_1.default.deleteScheduleForTarget('flow-1', ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, 'ws-1');
        expect(mockRepo.delete).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });
    it('throws InternalAccelanceError on repo failure', async () => {
        mockRepo.findOne.mockRejectedValue(new Error('db fail'));
        await expect(index_1.default.deleteScheduleForTarget('flow-1', ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, 'ws-1')).rejects.toMatchObject({
            statusCode: 500
        });
    });
});
// ─── getEnabledSchedulesBatch ─────────────────────────────────────────────────
describe('getEnabledSchedulesBatch', () => {
    it('queries only enabled records with correct defaults', async () => {
        const records = [makeRecord(), makeRecord({ id: 'rec-2' })];
        mockRepo.find.mockResolvedValue(records);
        const result = await index_1.default.getEnabledSchedulesBatch();
        expect(mockRepo.find).toHaveBeenCalledWith({
            where: { enabled: true },
            order: { createdDate: 'ASC' },
            skip: 0,
            take: 100
        });
        expect(result).toBe(records);
    });
    it('forwards custom skip/take values', async () => {
        mockRepo.find.mockResolvedValue([]);
        await index_1.default.getEnabledSchedulesBatch(50, 25);
        expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 50, take: 25 }));
    });
    it('throws InternalAccelanceError on failure', async () => {
        mockRepo.find.mockRejectedValue(new Error('db fail'));
        await expect(index_1.default.getEnabledSchedulesBatch()).rejects.toMatchObject({ statusCode: 500 });
    });
});
// ─── updateScheduleAfterRun ───────────────────────────────────────────────────
describe('updateScheduleAfterRun', () => {
    it('updates lastRunAt and nextRunAt on the record', async () => {
        mockRepo.update.mockResolvedValue(undefined);
        await index_1.default.updateScheduleAfterRun(mockAppDataSource, 'rec-1', '* * * * *', 'UTC');
        expect(mockRepo.update).toHaveBeenCalledWith({ id: 'rec-1' }, expect.objectContaining({
            lastRunAt: expect.any(Date),
            nextRunAt: expect.any(Date)
        }));
    });
    it('does not throw on update failure (logs instead)', async () => {
        mockRepo.update.mockRejectedValue(new Error('db fail'));
        // Should resolve without throwing
        await expect(index_1.default.updateScheduleAfterRun(mockAppDataSource, 'rec-1', '* * * * *')).resolves.toBeUndefined();
    });
});
// ─── getScheduleStatus ────────────────────────────────────────────────────────
describe('getScheduleStatus', () => {
    it('returns canEnable=false when chatflow is missing', async () => {
        mockRepo.findOne.mockResolvedValueOnce(makeRecord()).mockResolvedValueOnce(null);
        const result = await index_1.default.getScheduleStatus('flow-1', 'ws-1');
        expect(result.canEnable).toBe(false);
        expect(result.reason).toMatch(/Flow not found/);
    });
    it('returns canEnable=false when chatflow has no flowData', async () => {
        mockRepo.findOne.mockResolvedValueOnce(makeRecord()).mockResolvedValueOnce({ id: 'flow-1' });
        const result = await index_1.default.getScheduleStatus('flow-1', 'ws-1');
        expect(result.canEnable).toBe(false);
        expect(result.reason).toMatch(/Flow not found/);
    });
    it('returns canEnable=false when Start node is not a scheduleInput type', async () => {
        const flowData = JSON.stringify({
            nodes: [{ data: { name: 'startAgentflow', inputs: { startInputType: 'humanInput' } } }]
        });
        mockRepo.findOne.mockResolvedValueOnce(makeRecord()).mockResolvedValueOnce({ id: 'flow-1', flowData });
        const result = await index_1.default.getScheduleStatus('flow-1', 'ws-1');
        expect(result.canEnable).toBe(false);
        expect(result.reason).toMatch(/not configured as a scheduled flow/);
    });
    it('returns canEnable=false when cron expression is invalid', async () => {
        const flowData = makeScheduleFlowData({ scheduleCronExpression: 'not-valid' });
        mockRepo.findOne.mockResolvedValueOnce(makeRecord()).mockResolvedValueOnce({ id: 'flow-1', flowData });
        const result = await index_1.default.getScheduleStatus('flow-1', 'ws-1');
        expect(result.canEnable).toBe(false);
        expect(result.reason).toBeDefined();
    });
    it('returns canEnable=false when end date is in the past', async () => {
        const pastDate = new Date(Date.now() - 60_000).toISOString();
        const flowData = makeScheduleFlowData({ scheduleEndDate: pastDate });
        mockRepo.findOne.mockResolvedValueOnce(makeRecord()).mockResolvedValueOnce({ id: 'flow-1', flowData });
        const result = await index_1.default.getScheduleStatus('flow-1', 'ws-1');
        expect(result.canEnable).toBe(false);
        expect(result.reason).toMatch(/End date is in the past/);
    });
    it('returns canEnable=false when defaultInput is missing', async () => {
        const flowData = makeScheduleFlowData({ scheduleDefaultInput: '' });
        mockRepo.findOne.mockResolvedValueOnce(makeRecord({ defaultInput: undefined })).mockResolvedValueOnce({ id: 'flow-1', flowData });
        const result = await index_1.default.getScheduleStatus('flow-1', 'ws-1');
        expect(result.canEnable).toBe(false);
        expect(result.reason).toMatch(/Default input is required/);
    });
    it('returns canEnable=true for a fully valid schedule', async () => {
        const flowData = makeScheduleFlowData();
        mockRepo.findOne.mockResolvedValueOnce(makeRecord()).mockResolvedValueOnce({ id: 'flow-1', flowData });
        const result = await index_1.default.getScheduleStatus('flow-1', 'ws-1');
        expect(result.canEnable).toBe(true);
        expect(result.record).toBeDefined();
    });
    it('returns canEnable=false and reason when flowData JSON is malformed', async () => {
        mockRepo.findOne.mockResolvedValueOnce(makeRecord()).mockResolvedValueOnce({ id: 'flow-1', flowData: '{invalid json' });
        const result = await index_1.default.getScheduleStatus('flow-1', 'ws-1');
        expect(result.canEnable).toBe(false);
        expect(result.reason).toMatch(/Could not parse/);
    });
    it('throws InternalAccelanceError on unexpected DB error', async () => {
        mockRepo.findOne.mockRejectedValue(new Error('db fail'));
        await expect(index_1.default.getScheduleStatus('flow-1', 'ws-1')).rejects.toMatchObject({ statusCode: 500 });
    });
});
// ─── toggleScheduleEnabled ────────────────────────────────────────────────────
describe('toggleScheduleEnabled', () => {
    it('disables an existing schedule without checking validity', async () => {
        const record = makeRecord({ enabled: true });
        const saved = { ...record, enabled: false };
        mockRepo.findOne.mockResolvedValue(record);
        mockRepo.save.mockResolvedValue(saved);
        const result = await index_1.default.toggleScheduleEnabled('flow-1', 'ws-1', false);
        expect(result.enabled).toBe(false);
        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    });
    it('enables a valid schedule successfully', async () => {
        const record = makeRecord({ enabled: false });
        const saved = { ...record, enabled: true };
        // First findOne → schedule record; second findOne (inside getScheduleStatus) → schedule record again;
        // third findOne (inside getScheduleStatus) → chatflow
        const flowData = makeScheduleFlowData();
        mockRepo.findOne
            .mockResolvedValueOnce(record) // toggleScheduleEnabled lookup
            .mockResolvedValueOnce(record) // getScheduleStatus schedule record lookup
            .mockResolvedValueOnce({ id: 'flow-1', flowData }); // getScheduleStatus chatflow lookup
        mockRepo.save.mockResolvedValue(saved);
        const result = await index_1.default.toggleScheduleEnabled('flow-1', 'ws-1', true);
        expect(result.enabled).toBe(true);
    });
    it('throws NOT_FOUND when no schedule record exists', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        await expect(index_1.default.toggleScheduleEnabled('flow-1', 'ws-1', true)).rejects.toMatchObject({ statusCode: 404 });
    });
    it('throws BAD_REQUEST when enabling an invalid schedule', async () => {
        const record = makeRecord({ enabled: false });
        // getScheduleStatus will return canEnable=false (no chatflow)
        mockRepo.findOne
            .mockResolvedValueOnce(record) // toggle lookup
            .mockResolvedValueOnce(record) // getScheduleStatus schedule lookup
            .mockResolvedValueOnce(null); // getScheduleStatus chatflow → missing
        await expect(index_1.default.toggleScheduleEnabled('flow-1', 'ws-1', true)).rejects.toMatchObject({ statusCode: 400 });
    });
    it('throws InternalAccelanceError on unexpected repo error', async () => {
        mockRepo.findOne.mockRejectedValue(new Error('db fail'));
        await expect(index_1.default.toggleScheduleEnabled('flow-1', 'ws-1', false)).rejects.toMatchObject({ statusCode: 500 });
    });
});
// ─── createTriggerLog ─────────────────────────────────────────────────────────
describe('createTriggerLog', () => {
    const logData = {
        appDataSource: mockAppDataSource,
        scheduleRecordId: 'rec-1',
        triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
        targetId: 'flow-1',
        status: ScheduleTriggerLog_1.ScheduleTriggerStatus.RUNNING,
        scheduledAt: new Date('2025-01-01T09:00:00Z'),
        workspaceId: 'ws-1'
    };
    it('creates and saves a log entry with a generated id', async () => {
        const saved = { id: 'log-uuid', ...logData };
        mockRepo.create.mockReturnValue(saved);
        mockRepo.save.mockResolvedValue(saved);
        const result = await index_1.default.createTriggerLog(logData);
        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            scheduleRecordId: 'rec-1',
            status: ScheduleTriggerLog_1.ScheduleTriggerStatus.RUNNING,
            targetId: 'flow-1'
        }));
        expect(mockRepo.save).toHaveBeenCalledWith(saved);
        expect(result).toBe(saved);
    });
    it('re-throws errors from the repo', async () => {
        const err = new Error('insert failed');
        mockRepo.create.mockReturnValue({});
        mockRepo.save.mockRejectedValue(err);
        await expect(index_1.default.createTriggerLog(logData)).rejects.toThrow('insert failed');
    });
});
// ─── updateTriggerLog ─────────────────────────────────────────────────────────
describe('updateTriggerLog', () => {
    it('calls update with the correct id and fields', async () => {
        mockRepo.update.mockResolvedValue(undefined);
        await index_1.default.updateTriggerLog(mockAppDataSource, 'log-1', {
            status: ScheduleTriggerLog_1.ScheduleTriggerStatus.SUCCEEDED,
            elapsedTimeMs: 1234,
            executionId: 'exec-1'
        });
        expect(mockRepo.update).toHaveBeenCalledWith({ id: 'log-1' }, { status: ScheduleTriggerLog_1.ScheduleTriggerStatus.SUCCEEDED, elapsedTimeMs: 1234, executionId: 'exec-1' });
    });
    it('does not throw on update failure (logs instead)', async () => {
        mockRepo.update.mockRejectedValue(new Error('db fail'));
        await expect(index_1.default.updateTriggerLog(mockAppDataSource, 'log-1', { status: ScheduleTriggerLog_1.ScheduleTriggerStatus.FAILED })).resolves.toBeUndefined();
    });
});
// ─── getTriggerLogs ───────────────────────────────────────────────────────────
describe('getTriggerLogs', () => {
    beforeEach(() => {
        mockGetApp.mockReturnValue(mockAppServer);
    });
    const makeLog = (overrides = {}) => ({
        id: 'log-1',
        scheduleRecordId: 'rec-1',
        triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
        targetId: 'flow-1',
        status: ScheduleTriggerLog_1.ScheduleTriggerStatus.SUCCEEDED,
        scheduledAt: new Date(),
        workspaceId: 'ws-1',
        elapsedTimeMs: 1234,
        ...overrides
    });
    it('returns paginated logs with total count', async () => {
        const logs = [makeLog(), makeLog({ id: 'log-2', status: ScheduleTriggerLog_1.ScheduleTriggerStatus.FAILED })];
        mockRepo.findAndCount.mockResolvedValue([logs, 42]);
        const result = await index_1.default.getTriggerLogs('flow-1', 'ws-1', { page: 2, limit: 20 });
        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(42);
        expect(result.page).toBe(2);
        expect(result.limit).toBe(20);
    });
    it('scopes by targetId + workspaceId and orders by scheduledAt DESC', async () => {
        ;
        mockRepo.findAndCount.mockResolvedValue([[], 0]);
        await index_1.default.getTriggerLogs('flow-1', 'ws-1');
        expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ targetId: 'flow-1', workspaceId: 'ws-1' }),
            order: { scheduledAt: 'DESC' }
        }));
    });
    it('defaults page=1, limit=20 when not provided', async () => {
        ;
        mockRepo.findAndCount.mockResolvedValue([[], 0]);
        const result = await index_1.default.getTriggerLogs('flow-1', 'ws-1');
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
    });
    it('clamps limit to [1, 100]', async () => {
        ;
        mockRepo.findAndCount.mockResolvedValue([[], 0]);
        await index_1.default.getTriggerLogs('flow-1', 'ws-1', { limit: 500 });
        expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
        await index_1.default.getTriggerLogs('flow-1', 'ws-1', { limit: 0 });
        expect(mockRepo.findAndCount).toHaveBeenLastCalledWith(expect.objectContaining({ take: 1 }));
    });
    it('clamps page to >= 1', async () => {
        ;
        mockRepo.findAndCount.mockResolvedValue([[], 0]);
        await index_1.default.getTriggerLogs('flow-1', 'ws-1', { page: 0 });
        expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });
    it('computes skip as (page-1) * limit', async () => {
        ;
        mockRepo.findAndCount.mockResolvedValue([[], 0]);
        await index_1.default.getTriggerLogs('flow-1', 'ws-1', { page: 3, limit: 10 });
        expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
    });
    it('applies a single-value status filter', async () => {
        ;
        mockRepo.findAndCount.mockResolvedValue([[], 0]);
        await index_1.default.getTriggerLogs('flow-1', 'ws-1', { status: ScheduleTriggerLog_1.ScheduleTriggerStatus.FAILED });
        expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ status: ScheduleTriggerLog_1.ScheduleTriggerStatus.FAILED })
        }));
    });
    it('applies an array status filter', async () => {
        ;
        mockRepo.findAndCount.mockResolvedValue([[], 0]);
        const statuses = [ScheduleTriggerLog_1.ScheduleTriggerStatus.FAILED, ScheduleTriggerLog_1.ScheduleTriggerStatus.SKIPPED];
        await index_1.default.getTriggerLogs('flow-1', 'ws-1', { status: statuses });
        expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: statuses }) }));
    });
    it('wraps DB errors in InternalAccelanceError', async () => {
        ;
        mockRepo.findAndCount.mockRejectedValue(new Error('db down'));
        await expect(index_1.default.getTriggerLogs('flow-1', 'ws-1')).rejects.toMatchObject({
            statusCode: 500,
            message: expect.stringContaining('getTriggerLogs')
        });
        // Use InternalAccelanceError to verify the thrown type
        await expect(index_1.default.getTriggerLogs('flow-1', 'ws-1')).rejects.toBeInstanceOf(internalAccelanceError_1.InternalAccelanceError);
    });
});
// ─── deleteTriggerLogs ────────────────────────────────────────────────────────
const executions_1 = __importDefault(require("../executions"));
describe('deleteTriggerLogs', () => {
    const mockDeleteExecutions = executions_1.default.deleteExecutions;
    beforeEach(() => {
        mockGetApp.mockReturnValue(mockAppServer);
        mockRepo.find = jest.fn();
        mockRepo.delete = jest.fn();
        mockDeleteExecutions.mockReset().mockResolvedValue({ success: true, deletedCount: 0 });
    });
    const makeLog = (id, executionId) => ({
        id,
        targetId: 'flow-1',
        workspaceId: 'ws-1',
        scheduleRecordId: 'rec-1',
        triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
        status: ScheduleTriggerLog_1.ScheduleTriggerStatus.SUCCEEDED,
        executionId,
        scheduledAt: new Date()
    });
    it('returns zero counts when logIds is empty', async () => {
        const result = await index_1.default.deleteTriggerLogs('flow-1', 'ws-1', []);
        expect(result).toEqual({ success: true, deletedLogs: 0, deletedExecutions: 0 });
        expect(mockRepo.find).not.toHaveBeenCalled();
        expect(mockRepo.delete).not.toHaveBeenCalled();
    });
    it('returns zero counts when no logs match (cross-workspace deletion attempt)', async () => {
        ;
        mockRepo.find.mockResolvedValue([]);
        const result = await index_1.default.deleteTriggerLogs('flow-1', 'ws-1', ['log-from-other-ws']);
        expect(result).toEqual({ success: true, deletedLogs: 0, deletedExecutions: 0 });
        expect(mockRepo.delete).not.toHaveBeenCalled();
        expect(mockDeleteExecutions).not.toHaveBeenCalled();
    });
    it('scopes the find query by id + targetId + workspaceId', async () => {
        ;
        mockRepo.find.mockResolvedValue([]);
        await index_1.default.deleteTriggerLogs('flow-1', 'ws-1', ['log-1', 'log-2']);
        expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ targetId: 'flow-1', workspaceId: 'ws-1' })
        }));
    });
    it('deletes logs and cascades to executions for logs that have executionId', async () => {
        const logs = [makeLog('log-1', 'exec-1'), makeLog('log-2'), makeLog('log-3', 'exec-3')];
        mockRepo.find.mockResolvedValue(logs);
        mockRepo.delete.mockResolvedValue({ affected: 3 });
        mockDeleteExecutions.mockResolvedValue({ success: true, deletedCount: 2 });
        const result = await index_1.default.deleteTriggerLogs('flow-1', 'ws-1', ['log-1', 'log-2', 'log-3']);
        expect(result.deletedLogs).toBe(3);
        expect(result.deletedExecutions).toBe(2);
        expect(mockDeleteExecutions).toHaveBeenCalledWith(['exec-1', 'exec-3'], 'ws-1');
    });
    it('skips execution cascade when no logs have an executionId', async () => {
        ;
        mockRepo.find.mockResolvedValue([makeLog('log-1'), makeLog('log-2')]);
        mockRepo.delete.mockResolvedValue({ affected: 2 });
        const result = await index_1.default.deleteTriggerLogs('flow-1', 'ws-1', ['log-1', 'log-2']);
        expect(result.deletedLogs).toBe(2);
        expect(result.deletedExecutions).toBe(0);
        expect(mockDeleteExecutions).not.toHaveBeenCalled();
    });
    it('wraps DB errors in InternalAccelanceError', async () => {
        ;
        mockRepo.find.mockRejectedValue(new Error('db down'));
        await expect(index_1.default.deleteTriggerLogs('flow-1', 'ws-1', ['log-1'])).rejects.toBeInstanceOf(internalAccelanceError_1.InternalAccelanceError);
    });
});
//# sourceMappingURL=index.test.js.map