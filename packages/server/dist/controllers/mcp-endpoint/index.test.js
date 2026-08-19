"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// --- Mock setup ---
const mockHandleMcpRequest = jest.fn();
const mockHandleMcpDeleteRequest = jest.fn();
jest.mock('../../services/mcp-endpoint', () => ({
    __esModule: true,
    default: {
        handleMcpRequest: (...args) => mockHandleMcpRequest(...args),
        handleMcpDeleteRequest: (...args) => mockHandleMcpDeleteRequest(...args)
    }
}));
const mockGetRateLimiter = jest.fn().mockReturnValue((_req, _res, next) => next());
jest.mock('../../utils/rateLimit', () => ({
    RateLimiterManager: {
        getInstance: () => ({
            getRateLimiter: () => mockGetRateLimiter()
        })
    }
}));
jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));
// Import after mocking
const _1 = __importDefault(require("."));
// Helper: create mock Express objects
function mockReq(overrides = {}) {
    return {
        params: { chatflowId: 'flow-123' },
        headers: {},
        query: {},
        get: jest.fn(),
        ...overrides
    };
}
function mockRes() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        locals: {}
    };
    return res;
}
function mockNext() {
    return jest.fn();
}
beforeEach(() => {
    jest.clearAllMocks();
});
describe('MCP Endpoint Controller', () => {
    describe('authenticateToken', () => {
        it('returns 401 when Authorization header is missing', () => {
            const req = mockReq({ headers: {} });
            const res = mockRes();
            const next = mockNext();
            _1.default.authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                jsonrpc: '2.0',
                error: expect.objectContaining({ code: -32001 })
            }));
            expect(next).not.toHaveBeenCalled();
        });
        it('returns 401 when Authorization header is not Bearer', () => {
            const req = mockReq({ headers: { authorization: 'Basic dXNlcjpwYXNz' } });
            const res = mockRes();
            const next = mockNext();
            _1.default.authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
        it('returns 401 when Bearer token is empty', () => {
            const req = mockReq({ headers: { authorization: 'Bearer ' } });
            const res = mockRes();
            const next = mockNext();
            _1.default.authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
        it('sets res.locals.token and calls next on valid Bearer token', () => {
            const req = mockReq({ headers: { authorization: 'Bearer my-secret-token' } });
            const res = mockRes();
            const next = mockNext();
            _1.default.authenticateToken(req, res, next);
            expect(res.locals.token).toBe('my-secret-token');
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
    describe('handlePost', () => {
        it('calls service with chatflowId and token from res.locals.token', async () => {
            const req = mockReq({ params: { chatflowId: 'flow-123' } });
            const res = mockRes();
            res.locals.token = 'my-secret-token';
            const next = mockNext();
            mockHandleMcpRequest.mockResolvedValue(undefined);
            await _1.default.handlePost(req, res, next);
            expect(mockHandleMcpRequest).toHaveBeenCalledWith('flow-123', 'my-secret-token', req, res);
        });
        it('calls next(error) on unexpected errors', async () => {
            const req = mockReq({ params: { chatflowId: 'flow-123' } });
            const res = mockRes();
            res.locals.token = 'token';
            const next = mockNext();
            const error = new Error('Unexpected');
            mockHandleMcpRequest.mockRejectedValue(error);
            await _1.default.handlePost(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
    describe('handleDelete', () => {
        it('delegates to handleMcpDeleteRequest with chatflowId', async () => {
            const req = mockReq({ params: { chatflowId: 'flow-789' } });
            const res = mockRes();
            const next = mockNext();
            mockHandleMcpDeleteRequest.mockResolvedValue(undefined);
            await _1.default.handleDelete(req, res, next);
            expect(mockHandleMcpDeleteRequest).toHaveBeenCalledWith('flow-789', req, res);
        });
    });
    describe('getRateLimiterMiddleware', () => {
        it('delegates to RateLimiterManager', async () => {
            const req = mockReq();
            const res = mockRes();
            const next = mockNext();
            await _1.default.getRateLimiterMiddleware(req, res, next);
            expect(mockGetRateLimiter).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=index.test.js.map