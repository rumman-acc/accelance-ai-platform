"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRequest = createMockRequest;
/**
 * Create a typed mock Express Request for use with utilBuildChatflow().
 *
 * This factory produces a minimal Request-compatible object that satisfies
 * all properties accessed by utilBuildChatflow():
 *   - req.params.id
 *   - req.body (question, streaming, form, etc.)
 *   - req.get(header) (host, x-forwarded-proto, flowise-tool)
 *   - req.protocol
 *   - req.headers
 *   - req.files
 */
function createMockRequest(options) {
    const { chatflowId, body = {}, sourceRequest, files = [] } = options;
    const headers = sourceRequest ? { ...sourceRequest.headers } : { host: 'localhost:3000' };
    return {
        params: { id: chatflowId },
        body: {
            streaming: true,
            question: '',
            ...body
        },
        get: (header) => {
            if (sourceRequest)
                return sourceRequest.get(header);
            const lower = header.toLowerCase();
            const val = headers[lower];
            return typeof val === 'string' ? val : undefined;
        },
        protocol: sourceRequest?.protocol ?? 'http',
        headers,
        files
    };
}
//# sourceMappingURL=mockRequest.js.map