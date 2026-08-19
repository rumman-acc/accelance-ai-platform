"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
jest.mock('../../services/custom-mcp-servers', () => ({
    __esModule: true,
    default: {
        createCustomMcpServer: jest.fn(),
        getAllCustomMcpServers: jest.fn(),
        getCustomMcpServerById: jest.fn(),
        updateCustomMcpServer: jest.fn(),
        deleteCustomMcpServer: jest.fn(),
        authorizeCustomMcpServer: jest.fn(),
        getDiscoveredTools: jest.fn()
    }
}));
jest.mock('../../utils/pagination', () => ({
    getPageAndLimitParams: jest.fn()
}));
const index_1 = __importDefault(require("./index"));
const custom_mcp_servers_1 = __importDefault(require("../../services/custom-mcp-servers"));
const pagination_1 = require("../../utils/pagination");
const mockService = custom_mcp_servers_1.default;
const mockGetPageAndLimitParams = pagination_1.getPageAndLimitParams;
const makeReq = (overrides = {}) => ({
    body: undefined,
    params: {},
    query: {},
    user: {
        activeOrganizationId: 'org-1',
        activeWorkspaceId: 'ws-1'
    },
    ...overrides
});
const makeRes = () => {
    const res = { json: jest.fn() };
    return res;
};
const makeNext = () => jest.fn();
describe('customMcpServersController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('createCustomMcpServer', () => {
        it('should return error when body is not provided', async () => {
            const req = makeReq({ body: undefined });
            const next = makeNext();
            await index_1.default.createCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.PRECONDITION_FAILED
            }));
        });
        it('should return error when organization is not found', async () => {
            const req = makeReq({
                body: { name: 'test' },
                user: { activeOrganizationId: undefined, activeWorkspaceId: 'ws-1' }
            });
            const next = makeNext();
            await index_1.default.createCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.NOT_FOUND
            }));
        });
        it('should return error when workspace is not found', async () => {
            const req = makeReq({
                body: { name: 'test' },
                user: { activeOrganizationId: 'org-1', activeWorkspaceId: undefined }
            });
            const next = makeNext();
            await index_1.default.createCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.NOT_FOUND
            }));
        });
        it('should only pass allowlisted fields to service', async () => {
            const body = {
                name: 'My Server',
                serverUrl: 'https://example.com',
                iconSrc: 'icon.png',
                color: '#fff',
                authType: 'NONE',
                authConfig: { headers: {} },
                id: 'should-be-stripped',
                workspaceId: 'should-be-overridden',
                createdDate: 'should-be-stripped'
            };
            const req = makeReq({ body });
            const res = makeRes();
            mockService.createCustomMcpServer.mockResolvedValue({ id: 'new-1' });
            await index_1.default.createCustomMcpServer(req, res, makeNext());
            expect(mockService.createCustomMcpServer).toHaveBeenCalledWith({
                name: 'My Server',
                serverUrl: 'https://example.com',
                iconSrc: 'icon.png',
                color: '#fff',
                authType: 'NONE',
                authConfig: { headers: {} },
                workspaceId: 'ws-1'
            }, 'org-1');
            expect(res.json).toHaveBeenCalledWith({ id: 'new-1' });
        });
        it('should set workspaceId from authenticated user', async () => {
            const req = makeReq({ body: { name: 'test' } });
            const res = makeRes();
            mockService.createCustomMcpServer.mockResolvedValue({ id: 'new-1' });
            await index_1.default.createCustomMcpServer(req, res, makeNext());
            expect(mockService.createCustomMcpServer).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws-1' }), 'org-1');
        });
        it('should call next on service error', async () => {
            const req = makeReq({ body: { name: 'test' } });
            const next = makeNext();
            const error = new Error('db failure');
            mockService.createCustomMcpServer.mockRejectedValue(error);
            await index_1.default.createCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
    describe('getAllCustomMcpServers', () => {
        it('should pass workspace and pagination params to service', async () => {
            const req = makeReq();
            const res = makeRes();
            mockGetPageAndLimitParams.mockReturnValue({ page: 2, limit: 10 });
            mockService.getAllCustomMcpServers.mockResolvedValue({ data: [], total: 0 });
            await index_1.default.getAllCustomMcpServers(req, res, makeNext());
            expect(mockService.getAllCustomMcpServers).toHaveBeenCalledWith('ws-1', 2, 10);
            expect(res.json).toHaveBeenCalledWith({ data: [], total: 0 });
        });
        it('should substitute defaults when pagination is absent (-1/-1)', async () => {
            const req = makeReq();
            mockGetPageAndLimitParams.mockReturnValue({ page: -1, limit: -1 });
            mockService.getAllCustomMcpServers.mockResolvedValue({ data: [], total: 0 });
            await index_1.default.getAllCustomMcpServers(req, makeRes(), makeNext());
            expect(mockService.getAllCustomMcpServers).toHaveBeenCalledWith('ws-1', 1, 50);
        });
        it('should clamp oversized limit to the ceiling', async () => {
            const req = makeReq();
            mockGetPageAndLimitParams.mockReturnValue({ page: 1, limit: 100000 });
            mockService.getAllCustomMcpServers.mockResolvedValue({ data: [], total: 0 });
            await index_1.default.getAllCustomMcpServers(req, makeRes(), makeNext());
            expect(mockService.getAllCustomMcpServers).toHaveBeenCalledWith('ws-1', 1, 500);
        });
        it('should call next on service error', async () => {
            const req = makeReq();
            const next = makeNext();
            mockGetPageAndLimitParams.mockReturnValue({ page: 1, limit: 10 });
            mockService.getAllCustomMcpServers.mockRejectedValue(new Error('fail'));
            await index_1.default.getAllCustomMcpServers(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
    describe('authType enum validation', () => {
        it('rejects create with an unknown authType', async () => {
            const req = makeReq({ body: { name: 'T', serverUrl: 'https://x.com', authType: 'HAXX' } });
            const next = makeNext();
            await index_1.default.createCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST }));
            expect(mockService.createCustomMcpServer).not.toHaveBeenCalled();
        });
        it('rejects update with an unknown authType', async () => {
            const req = makeReq({ params: { id: 'mcp-1' }, body: { authType: 'HAXX' } });
            const next = makeNext();
            await index_1.default.updateCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST }));
            expect(mockService.updateCustomMcpServer).not.toHaveBeenCalled();
        });
        it('accepts create with a valid authType (NONE)', async () => {
            const req = makeReq({ body: { name: 'T', serverUrl: 'https://x.com', authType: 'NONE' } });
            mockService.createCustomMcpServer.mockResolvedValue({});
            await index_1.default.createCustomMcpServer(req, makeRes(), makeNext());
            expect(mockService.createCustomMcpServer).toHaveBeenCalled();
        });
    });
    describe('getCustomMcpServerById', () => {
        it('should return error when id is not provided', async () => {
            const req = makeReq({ params: {} });
            const next = makeNext();
            await index_1.default.getCustomMcpServerById(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.PRECONDITION_FAILED
            }));
        });
        it('should return error when workspace is not found', async () => {
            const req = makeReq({
                params: { id: 'mcp-1' },
                user: { activeWorkspaceId: undefined }
            });
            const next = makeNext();
            await index_1.default.getCustomMcpServerById(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.NOT_FOUND
            }));
        });
        it('should call service with id and workspaceId', async () => {
            const req = makeReq({ params: { id: 'mcp-1' } });
            const res = makeRes();
            const mockResponse = { id: 'mcp-1', name: 'Test' };
            mockService.getCustomMcpServerById.mockResolvedValue(mockResponse);
            await index_1.default.getCustomMcpServerById(req, res, makeNext());
            expect(mockService.getCustomMcpServerById).toHaveBeenCalledWith('mcp-1', 'ws-1');
            expect(res.json).toHaveBeenCalledWith(mockResponse);
        });
    });
    describe('updateCustomMcpServer', () => {
        it('should return error when id is not provided', async () => {
            const req = makeReq({ params: {}, body: { name: 'updated' } });
            const next = makeNext();
            await index_1.default.updateCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.PRECONDITION_FAILED
            }));
        });
        it('should return error when body is not provided', async () => {
            const req = makeReq({ params: { id: 'mcp-1' }, body: undefined });
            const next = makeNext();
            await index_1.default.updateCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.PRECONDITION_FAILED
            }));
        });
        it('should return error when workspace is not found', async () => {
            const req = makeReq({
                params: { id: 'mcp-1' },
                body: { name: 'updated' },
                user: { activeWorkspaceId: undefined }
            });
            const next = makeNext();
            await index_1.default.updateCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.NOT_FOUND
            }));
        });
        it('should only pass allowlisted fields to service', async () => {
            const body = {
                name: 'Updated',
                serverUrl: 'https://new-url.com',
                iconSrc: 'new-icon.png',
                color: '#000',
                authType: 'CUSTOM_HEADERS',
                authConfig: { headers: { 'X-Key': 'val' } },
                id: 'should-be-stripped',
                workspaceId: 'should-be-stripped',
                status: 'should-be-stripped'
            };
            const req = makeReq({ params: { id: 'mcp-1' }, body });
            const res = makeRes();
            mockService.updateCustomMcpServer.mockResolvedValue({ id: 'mcp-1' });
            await index_1.default.updateCustomMcpServer(req, res, makeNext());
            expect(mockService.updateCustomMcpServer).toHaveBeenCalledWith('mcp-1', {
                name: 'Updated',
                serverUrl: 'https://new-url.com',
                iconSrc: 'new-icon.png',
                color: '#000',
                authType: 'CUSTOM_HEADERS',
                authConfig: { headers: { 'X-Key': 'val' } }
            }, 'ws-1');
            expect(res.json).toHaveBeenCalledWith({ id: 'mcp-1' });
        });
    });
    describe('deleteCustomMcpServer', () => {
        it('should return error when id is not provided', async () => {
            const req = makeReq({ params: {} });
            const next = makeNext();
            await index_1.default.deleteCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.PRECONDITION_FAILED
            }));
        });
        it('should return error when workspace is not found', async () => {
            const req = makeReq({
                params: { id: 'mcp-1' },
                user: { activeWorkspaceId: undefined }
            });
            const next = makeNext();
            await index_1.default.deleteCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.NOT_FOUND
            }));
        });
        it('should call service with id and workspaceId', async () => {
            const req = makeReq({ params: { id: 'mcp-1' } });
            const res = makeRes();
            mockService.deleteCustomMcpServer.mockResolvedValue({ affected: 1 });
            await index_1.default.deleteCustomMcpServer(req, res, makeNext());
            expect(mockService.deleteCustomMcpServer).toHaveBeenCalledWith('mcp-1', 'ws-1');
            expect(res.json).toHaveBeenCalledWith({ affected: 1 });
        });
    });
    describe('authorizeCustomMcpServer', () => {
        it('should return error when id is not provided', async () => {
            const req = makeReq({ params: {} });
            const next = makeNext();
            await index_1.default.authorizeCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.PRECONDITION_FAILED
            }));
        });
        it('should return error when workspace is not found', async () => {
            const req = makeReq({
                params: { id: 'mcp-1' },
                user: { activeWorkspaceId: undefined }
            });
            const next = makeNext();
            await index_1.default.authorizeCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.NOT_FOUND
            }));
        });
        it('should call service with id and workspaceId', async () => {
            const req = makeReq({ params: { id: 'mcp-1' } });
            const res = makeRes();
            mockService.authorizeCustomMcpServer.mockResolvedValue({ id: 'mcp-1', status: 'AUTHORIZED' });
            await index_1.default.authorizeCustomMcpServer(req, res, makeNext());
            expect(mockService.authorizeCustomMcpServer).toHaveBeenCalledWith('mcp-1', 'ws-1');
            expect(res.json).toHaveBeenCalledWith({ id: 'mcp-1', status: 'AUTHORIZED' });
        });
        it('should call next on service error', async () => {
            const req = makeReq({ params: { id: 'mcp-1' } });
            const next = makeNext();
            mockService.authorizeCustomMcpServer.mockRejectedValue(new Error('connection failed'));
            await index_1.default.authorizeCustomMcpServer(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
    describe('getDiscoveredTools', () => {
        it('should return error when id is not provided', async () => {
            const req = makeReq({ params: {} });
            const next = makeNext();
            await index_1.default.getDiscoveredTools(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.PRECONDITION_FAILED
            }));
        });
        it('should return error when workspace is not found', async () => {
            const req = makeReq({
                params: { id: 'mcp-1' },
                user: { activeWorkspaceId: undefined }
            });
            const next = makeNext();
            await index_1.default.getDiscoveredTools(req, makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: http_status_codes_1.StatusCodes.NOT_FOUND
            }));
        });
        it('should call service with id and workspaceId', async () => {
            const req = makeReq({ params: { id: 'mcp-1' } });
            const res = makeRes();
            const tools = [
                { name: 'tool1', description: 'description1', inputSchema: null },
                { name: 'tool2', description: 'description2', inputSchema: null }
            ];
            mockService.getDiscoveredTools.mockResolvedValue(tools);
            await index_1.default.getDiscoveredTools(req, res, makeNext());
            expect(mockService.getDiscoveredTools).toHaveBeenCalledWith('mcp-1', 'ws-1');
            expect(res.json).toHaveBeenCalledWith(tools);
        });
    });
});
//# sourceMappingURL=index.test.js.map