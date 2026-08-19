"use strict";
/**
 * Unit tests for chatflowsService.saveChatflow and chatflowsService.updateChatflow.
 * All infrastructure (TypeORM, ScheduleService, ScheduleBeat, telemetry, etc.)
 * is mocked — no DB or Express app required.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Shared repo mock ─────────────────────────────────────────────────────────
const mockRepo = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    merge: jest.fn(),
    countBy: jest.fn(),
    createQueryBuilder: jest.fn()
};
const mockAppServer = {
    AppDataSource: {
        getRepository: jest.fn().mockReturnValue(mockRepo)
    },
    telemetry: {
        sendTelemetry: jest.fn().mockResolvedValue(undefined)
    },
    identityManager: {
        getProductIdFromSubscription: jest.fn().mockResolvedValue('prod-1')
    },
    metricsProvider: {
        incrementCounter: jest.fn()
    },
    usageCacheManager: {}
};
// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn().mockReturnValue(mockAppServer)
}));
jest.mock('../../database/entities/ChatFlow', () => ({
    ChatFlow: class ChatFlow {
    },
    EnumChatflowType: { AGENTFLOW: 'AGENTFLOW', CHATFLOW: 'CHATFLOW', MULTIAGENT: 'MULTIAGENT' }
}));
jest.mock('../../database/entities/ChatMessage', () => ({ ChatMessage: class ChatMessage {
    } }));
jest.mock('../../database/entities/ChatMessageFeedback', () => ({ ChatMessageFeedback: class ChatMessageFeedback {
    } }));
jest.mock('../../database/entities/UpsertHistory', () => ({ UpsertHistory: class UpsertHistory {
    } }));
jest.mock('../../database/entities/ScheduleRecord', () => ({
    ScheduleRecord: class ScheduleRecord {
    },
    ScheduleTriggerType: { AGENTFLOW: 'AGENTFLOW' }
}));
jest.mock('../../enterprise/database/entities/workspace.entity', () => ({ Workspace: class Workspace {
    } }));
jest.mock('../../enterprise/utils/ControllerServiceUtils', () => ({ getWorkspaceSearchOptions: jest.fn().mockReturnValue({}) }));
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
jest.mock('../../services/documentstore', () => ({
    __esModule: true,
    default: { updateDocumentStoreUsage: jest.fn().mockResolvedValue(undefined) }
}));
jest.mock('../../utils', () => ({
    constructGraphs: jest.fn().mockReturnValue({ graph: {}, nodeDependencies: {} }),
    getAppVersion: jest.fn().mockResolvedValue('1.0.0'),
    getEndingNodes: jest.fn().mockReturnValue([]),
    getTelemetryFlowObj: jest.fn().mockReturnValue({}),
    isFlowValidForStream: jest.fn().mockReturnValue(false)
}));
jest.mock('../../utils/fileValidation', () => ({
    sanitizeAllowedUploadMimeTypesFromConfig: jest.fn((x) => x)
}));
jest.mock('../../utils/fileRepository', () => ({
    containsBase64File: jest.fn().mockReturnValue(false),
    updateFlowDataWithFilePaths: jest.fn().mockImplementation(async (_id, fd) => fd)
}));
jest.mock('../../utils/sanitizeFlowData', () => ({
    sanitizeFlowDataForPublicEndpoint: jest.fn().mockReturnValue('{}')
}));
jest.mock('../../utils/getUploadsConfig', () => ({ utilGetUploadsConfig: jest.fn().mockResolvedValue(null) }));
jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() }
}));
jest.mock('../../utils/quotaUsage', () => ({ updateStorageUsage: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../services/schedule', () => ({
    __esModule: true,
    default: {
        resolveScheduleCron: jest.fn().mockReturnValue({ valid: true, cronExpression: '* * * * *' }),
        canScheduleEnable: jest.fn().mockReturnValue(true),
        createOrUpdateSchedule: jest.fn().mockResolvedValue({ id: 'sched-1', enabled: true }),
        deleteScheduleForTarget: jest.fn().mockResolvedValue(undefined)
    }
}));
jest.mock('../../schedule/ScheduleBeat', () => ({
    ScheduleBeat: {
        getInstance: jest.fn().mockReturnValue({
            onScheduleChanged: jest.fn().mockResolvedValue(undefined)
        })
    }
}));
jest.mock('accelance-components', () => ({ removeFolderFromStorage: jest.fn().mockResolvedValue({ totalSize: 0 }) }), { virtual: true });
jest.mock('uuid', () => ({ validate: jest.fn().mockReturnValue(true) }));
jest.mock('http-status-codes', () => ({
    StatusCodes: { OK: 200, BAD_REQUEST: 400, NOT_FOUND: 404, INTERNAL_SERVER_ERROR: 500 }
}));
// ─── Imports (after mocks) ────────────────────────────────────────────────────
const index_1 = __importDefault(require("./index"));
const schedule_1 = __importDefault(require("../../services/schedule"));
const ScheduleBeat_1 = require("../../schedule/ScheduleBeat");
const fileRepository_1 = require("../../utils/fileRepository");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const ScheduleRecord_1 = require("../../database/entities/ScheduleRecord");
const mockContainsBase64File = fileRepository_1.containsBase64File;
const mockCreateOrUpdateSchedule = schedule_1.default.createOrUpdateSchedule;
const mockDeleteScheduleForTarget = schedule_1.default.deleteScheduleForTarget;
const mockResolveScheduleCron = schedule_1.default.resolveScheduleCron;
const mockCanScheduleEnable = schedule_1.default.canScheduleEnable;
// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Build a minimal scheduleInput AGENTFLOW flowData JSON */
const makeScheduleFlowData = (inputs = {}) => JSON.stringify({
    nodes: [
        {
            id: 'start-0',
            data: {
                name: 'startAgentflow',
                inputs: {
                    startInputType: 'scheduleInput',
                    scheduleCronExpression: '* * * * *',
                    scheduleTimezone: 'UTC',
                    scheduleInputMode: 'text',
                    scheduleDefaultInput: 'hello',
                    ...inputs
                }
            }
        }
    ],
    edges: []
});
/** Build a non-schedule AGENTFLOW flowData JSON (chatInput start) */
const makeChatInputFlowData = () => JSON.stringify({
    nodes: [{ id: 'start-0', data: { name: 'startAgentflow', inputs: { startInputType: 'chatInput' } } }],
    edges: []
});
/** Build a plain (non-agentflow) flowData JSON */
const makePlainFlowData = () => JSON.stringify({ nodes: [], edges: [] });
const makeChatflow = (overrides = {}) => ({
    id: 'flow-1',
    type: ChatFlow_1.EnumChatflowType.AGENTFLOW,
    flowData: makeScheduleFlowData(),
    workspaceId: 'ws-1',
    chatbotConfig: undefined,
    ...overrides
});
const SAVE_ARGS = {
    orgId: 'org-1',
    workspaceId: 'ws-1',
    subscriptionId: 'sub-1',
    usageCacheManager: {}
};
beforeEach(() => {
    jest.clearAllMocks();
    mockAppServer.AppDataSource.getRepository.mockReturnValue(mockRepo);
    mockRepo.create.mockImplementation((x) => x);
    mockRepo.save.mockResolvedValue(makeChatflow());
    mockRepo.merge.mockImplementation((_existing, updates) => ({ ...makeChatflow(), ...updates }));
    mockContainsBase64File.mockReturnValue(false);
    mockCreateOrUpdateSchedule.mockResolvedValue({ id: 'sched-1', enabled: true });
    mockDeleteScheduleForTarget.mockResolvedValue(undefined);
    mockResolveScheduleCron.mockReturnValue({ valid: true, cronExpression: '* * * * *' });
    mockCanScheduleEnable.mockReturnValue(true);
    ScheduleBeat_1.ScheduleBeat.getInstance.mockReturnValue({
        onScheduleChanged: jest.fn().mockResolvedValue(undefined)
    });
});
// ─── saveChatflow ─────────────────────────────────────────────────────────────
describe('saveChatflow', () => {
    it('saves and returns the chatflow', async () => {
        const newFlow = makeChatflow({ type: ChatFlow_1.EnumChatflowType.AGENTFLOW });
        const saved = makeChatflow();
        mockRepo.save.mockResolvedValue(saved);
        const result = await index_1.default.saveChatflow(newFlow, SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockRepo.save).toHaveBeenCalled();
        expect(result).toBe(saved);
    });
    it('throws BAD_REQUEST for an invalid chatflow type', async () => {
        const badFlow = makeChatflow({ type: 'INVALID_TYPE' });
        await expect(index_1.default.saveChatflow(badFlow, SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager)).rejects.toMatchObject({ statusCode: 400 });
    });
    // ── schedule sync (AGENTFLOW + scheduleInput) ────────────────────────────
    it('creates or updates the schedule when the start node is scheduleInput', async () => {
        const newFlow = makeChatflow();
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makeScheduleFlowData() }));
        await index_1.default.saveChatflow(newFlow, SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockCreateOrUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({
            triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW,
            targetId: 'flow-1',
            workspaceId: 'ws-1'
        }));
    });
    it('calls onScheduleChanged upsert when the schedule is enabled', async () => {
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makeScheduleFlowData() }));
        mockCreateOrUpdateSchedule.mockResolvedValue({ id: 'sched-1', enabled: true });
        mockCanScheduleEnable.mockReturnValue(true);
        await index_1.default.saveChatflow(makeChatflow(), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        const beat = ScheduleBeat_1.ScheduleBeat.getInstance();
        expect(beat.onScheduleChanged).toHaveBeenCalledWith('sched-1', 'upsert');
    });
    it('does NOT call onScheduleChanged when the schedule is disabled', async () => {
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makeScheduleFlowData() }));
        mockCreateOrUpdateSchedule.mockResolvedValue({ id: 'sched-1', enabled: false });
        mockCanScheduleEnable.mockReturnValue(false);
        await index_1.default.saveChatflow(makeChatflow(), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        const beat = ScheduleBeat_1.ScheduleBeat.getInstance();
        expect(beat.onScheduleChanged).not.toHaveBeenCalled();
    });
    it('passes scheduleEndDate as a Date when set in flowData', async () => {
        const futureDate = new Date(Date.now() + 86_400_000).toISOString();
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makeScheduleFlowData({ scheduleEndDate: futureDate }) }));
        await index_1.default.saveChatflow(makeChatflow(), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockCreateOrUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({ endDate: expect.any(Date) }));
    });
    it('passes undefined endDate when scheduleEndDate is not set', async () => {
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makeScheduleFlowData() }));
        await index_1.default.saveChatflow(makeChatflow(), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockCreateOrUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({ endDate: undefined }));
    });
    // ── schedule input mode ───────────────────────────────────────────────────
    it("defaults scheduleInputMode to 'text' and passes defaultInput when mode is not set", async () => {
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makeScheduleFlowData() }));
        await index_1.default.saveChatflow(makeChatflow(), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockCreateOrUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({ scheduleInputMode: 'text', defaultInput: 'hello', defaultForm: undefined }));
    });
    it("passes defaultForm (stringified) when scheduleInputMode is 'form'", async () => {
        mockRepo.save.mockResolvedValue(makeChatflow({
            flowData: makeScheduleFlowData({
                scheduleInputMode: 'form',
                scheduleFormDefaults: { team: 'eng', metric: 'p95' },
                scheduleDefaultInput: ''
            })
        }));
        await index_1.default.saveChatflow(makeChatflow(), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        const call = mockCreateOrUpdateSchedule.mock.calls[0][0];
        expect(call.scheduleInputMode).toBe('form');
        expect(call.defaultInput).toBe(''); // cleared in form mode
        expect(JSON.parse(call.defaultForm)).toEqual({ team: 'eng', metric: 'p95' });
    });
    it("passes empty defaultInput and no defaultForm when scheduleInputMode is 'none'", async () => {
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makeScheduleFlowData({ scheduleInputMode: 'none', scheduleDefaultInput: 'ignored' }) }));
        await index_1.default.saveChatflow(makeChatflow(), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockCreateOrUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({ scheduleInputMode: 'none', defaultInput: '', defaultForm: undefined }));
    });
    it('does not create a schedule when the start node type is chatInput', async () => {
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makeChatInputFlowData() }));
        await index_1.default.saveChatflow(makeChatflow({ flowData: makeChatInputFlowData() }), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockCreateOrUpdateSchedule).not.toHaveBeenCalled();
    });
    it('does not create a schedule for a non-AGENTFLOW type', async () => {
        const chatflow = makeChatflow({ type: ChatFlow_1.EnumChatflowType.CHATFLOW, flowData: makePlainFlowData() });
        mockRepo.save.mockResolvedValue(chatflow);
        await index_1.default.saveChatflow(chatflow, SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockCreateOrUpdateSchedule).not.toHaveBeenCalled();
    });
    // ── telemetry ─────────────────────────────────────────────────────────────
    it('sends chatflow_created telemetry after saving', async () => {
        mockRepo.save.mockResolvedValue(makeChatflow({ flowData: makePlainFlowData() }));
        await index_1.default.saveChatflow(makeChatflow({ type: ChatFlow_1.EnumChatflowType.CHATFLOW, flowData: makePlainFlowData() }), SAVE_ARGS.orgId, SAVE_ARGS.workspaceId, SAVE_ARGS.subscriptionId, SAVE_ARGS.usageCacheManager);
        expect(mockAppServer.telemetry.sendTelemetry).toHaveBeenCalledWith('chatflow_created', expect.any(Object), SAVE_ARGS.orgId);
    });
});
// ─── updateChatflow ───────────────────────────────────────────────────────────
describe('updateChatflow', () => {
    const existingFlow = makeChatflow();
    it('saves and returns the merged chatflow', async () => {
        const updates = makeChatflow({ flowData: makeScheduleFlowData() });
        const merged = { ...existingFlow, ...updates };
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        const result = await index_1.default.updateChatflow(existingFlow, updates, 'org-1', 'ws-1', 'sub-1');
        expect(mockRepo.merge).toHaveBeenCalled();
        expect(mockRepo.save).toHaveBeenCalled();
        expect(result).toBe(merged);
    });
    it('throws BAD_REQUEST when updateChatFlow.type is invalid', async () => {
        const updates = makeChatflow({ type: 'BAD_TYPE' });
        await expect(index_1.default.updateChatflow(existingFlow, updates, 'org-1', 'ws-1', 'sub-1')).rejects.toMatchObject({
            statusCode: 400
        });
    });
    it('preserves existing type when updateChatFlow.type is not provided', async () => {
        const updates = { flowData: makeScheduleFlowData() }; // no type field
        const merged = { ...existingFlow, flowData: makeScheduleFlowData() };
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        await index_1.default.updateChatflow(existingFlow, updates, 'org-1', 'ws-1', 'sub-1');
        // Type should have been copied from existing flow
        expect(updates).toMatchObject({ type: existingFlow.type });
    });
    it('throws BAD_REQUEST when chatbotConfig is invalid JSON', async () => {
        const updates = makeChatflow({ chatbotConfig: 'not-json' });
        await expect(index_1.default.updateChatflow(existingFlow, updates, 'org-1', 'ws-1', 'sub-1')).rejects.toMatchObject({
            statusCode: 400
        });
    });
    // ── schedule sync — scheduleInput branch ─────────────────────────────────
    it('creates or updates the schedule when start node is scheduleInput', async () => {
        const updates = makeChatflow({ flowData: makeScheduleFlowData() });
        const merged = { ...existingFlow, flowData: makeScheduleFlowData(), type: ChatFlow_1.EnumChatflowType.AGENTFLOW };
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        await index_1.default.updateChatflow(existingFlow, updates, 'org-1', 'ws-1', 'sub-1');
        expect(mockCreateOrUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({ triggerType: ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, targetId: 'flow-1', workspaceId: 'ws-1' }));
    });
    it('calls onScheduleChanged upsert when the updated schedule is enabled', async () => {
        const merged = makeChatflow({ flowData: makeScheduleFlowData() });
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        mockCreateOrUpdateSchedule.mockResolvedValue({ id: 'sched-1', enabled: true });
        await index_1.default.updateChatflow(existingFlow, makeChatflow(), 'org-1', 'ws-1', 'sub-1');
        const beat = ScheduleBeat_1.ScheduleBeat.getInstance();
        expect(beat.onScheduleChanged).toHaveBeenCalledWith('sched-1', 'upsert');
    });
    it('calls onScheduleChanged delete when the updated schedule is disabled', async () => {
        const merged = makeChatflow({ flowData: makeScheduleFlowData() });
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        mockCreateOrUpdateSchedule.mockResolvedValue({ id: 'sched-1', enabled: false });
        mockCanScheduleEnable.mockReturnValue(false);
        await index_1.default.updateChatflow(existingFlow, makeChatflow(), 'org-1', 'ws-1', 'sub-1');
        const beat = ScheduleBeat_1.ScheduleBeat.getInstance();
        expect(beat.onScheduleChanged).toHaveBeenCalledWith('sched-1', 'delete');
    });
    it('sets enabled=false in createOrUpdateSchedule when canScheduleEnable returns false', async () => {
        const merged = makeChatflow({ flowData: makeScheduleFlowData() });
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        mockCanScheduleEnable.mockReturnValue(false);
        mockCreateOrUpdateSchedule.mockResolvedValue({ id: 'sched-1', enabled: false });
        await index_1.default.updateChatflow(existingFlow, makeChatflow(), 'org-1', 'ws-1', 'sub-1');
        expect(mockCreateOrUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    });
    it('passes undefined enabled in createOrUpdateSchedule when canScheduleEnable returns true (preserve existing)', async () => {
        const merged = makeChatflow({ flowData: makeScheduleFlowData() });
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        mockCanScheduleEnable.mockReturnValue(true);
        mockCreateOrUpdateSchedule.mockResolvedValue({ id: 'sched-1', enabled: true });
        await index_1.default.updateChatflow(existingFlow, makeChatflow(), 'org-1', 'ws-1', 'sub-1');
        expect(mockCreateOrUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({ enabled: undefined }));
    });
    // ── schedule sync — non-scheduleInput branch ──────────────────────────────
    it('deletes existing schedule when start node switches away from scheduleInput', async () => {
        const merged = makeChatflow({ flowData: makeChatInputFlowData() });
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        await index_1.default.updateChatflow(existingFlow, makeChatflow({ flowData: makeChatInputFlowData() }), 'org-1', 'ws-1', 'sub-1');
        expect(mockDeleteScheduleForTarget).toHaveBeenCalledWith('flow-1', ScheduleRecord_1.ScheduleTriggerType.AGENTFLOW, 'ws-1');
    });
    it('calls onScheduleChanged delete after deleting the existing schedule record', async () => {
        const merged = makeChatflow({ flowData: makeChatInputFlowData() });
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        mockDeleteScheduleForTarget.mockResolvedValue({ id: 'sched-old' });
        await index_1.default.updateChatflow(existingFlow, makeChatflow({ flowData: makeChatInputFlowData() }), 'org-1', 'ws-1', 'sub-1');
        const beat = ScheduleBeat_1.ScheduleBeat.getInstance();
        expect(beat.onScheduleChanged).toHaveBeenCalledWith('sched-old', 'delete');
    });
    it('does not call onScheduleChanged when no existing schedule was found', async () => {
        const merged = makeChatflow({ flowData: makeChatInputFlowData() });
        mockRepo.merge.mockReturnValue(merged);
        mockRepo.save.mockResolvedValue(merged);
        mockDeleteScheduleForTarget.mockResolvedValue(undefined);
        await index_1.default.updateChatflow(existingFlow, makeChatflow({ flowData: makeChatInputFlowData() }), 'org-1', 'ws-1', 'sub-1');
        const beat = ScheduleBeat_1.ScheduleBeat.getInstance();
        expect(beat.onScheduleChanged).not.toHaveBeenCalled();
    });
    it('does not touch schedules for a non-AGENTFLOW type', async () => {
        const nonAgentFlow = makeChatflow({ type: ChatFlow_1.EnumChatflowType.CHATFLOW, flowData: makePlainFlowData() });
        mockRepo.merge.mockReturnValue(nonAgentFlow);
        mockRepo.save.mockResolvedValue(nonAgentFlow);
        await index_1.default.updateChatflow(existingFlow, nonAgentFlow, 'org-1', 'ws-1', 'sub-1');
        expect(mockCreateOrUpdateSchedule).not.toHaveBeenCalled();
        expect(mockDeleteScheduleForTarget).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=index.test.js.map