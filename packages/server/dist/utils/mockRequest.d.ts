import { Request } from 'express';
export interface MockRequestOptions {
    /** The chatflow ID — sets req.params.id */
    chatflowId: string;
    /** The request body — merged with defaults */
    body?: Record<string, any>;
    /** The original incoming request to inherit host/protocol/headers from */
    sourceRequest?: Request;
    /** Uploaded files (default: []) */
    files?: Express.Multer.File[];
}
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
export declare function createMockRequest(options: MockRequestOptions): Request;
