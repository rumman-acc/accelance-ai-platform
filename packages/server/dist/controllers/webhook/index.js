"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const uuid_1 = require("uuid");
const rateLimit_1 = require("../../utils/rateLimit");
const predictions_1 = __importDefault(require("../../services/predictions"));
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const webhook_1 = __importDefault(require("../../services/webhook"));
const webhook_listener_1 = require("../../services/webhook-listener");
const accelance_components_1 = require("accelance-components");
const Interface_1 = require("../../Interface");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const callbackDispatcher_1 = require("../../utils/callbackDispatcher");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const logger_1 = __importDefault(require("../../utils/logger"));
const createWebhook = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: webhookController.createWebhook - id not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        // For form-encoded requests, unwrap JSON encoded in a `payload` field (e.g. GitHub webhooks)
        // so $webhook.body.* resolves against the actual payload fields.
        const contentType = (req.headers['content-type'] ?? '').toLowerCase();
        let body = req.body;
        if (contentType.startsWith('application/x-www-form-urlencoded') && typeof body?.payload === 'string') {
            try {
                body = JSON.parse(body.payload);
            }
            catch {
                // leave body as-is if payload isn't valid JSON
            }
        }
        const isResume = body?.humanInput != null;
        const { responseMode, callbackUrl, callbackSecret } = await webhook_1.default.validateWebhookChatflow(req.params.id, workspaceId, body, req.method, req.headers, req.query, req.rawBody, isResume ? { skipFieldValidation: true } : undefined);
        // Namespace the webhook payload so $webhook.body.*, $webhook.headers.*, $webhook.query.* can coexist
        req.body = {
            webhook: {
                body,
                headers: (0, accelance_components_1.redactSensitiveHeaders)(req.headers),
                query: req.query
            }
        };
        const { humanInput, chatId: bodyChatId, sessionId } = body ?? {};
        if (humanInput != null)
            req.body.humanInput = humanInput;
        if (bodyChatId != null)
            req.body.chatId = bodyChatId;
        if (sessionId != null)
            req.body.sessionId = sessionId;
        const executionChatId = bodyChatId ?? (0, uuid_1.v4)();
        req.body.chatId = executionChatId;
        // Mirror this execution's events to any UI panels currently listening to this flow.
        try {
            await (0, webhook_listener_1.getWebhookListenerRegistry)().bindExecution(req.params.id, executionChatId);
        }
        catch (err) {
            logger_1.default.warn(`[webhookController] Failed to bind webhook listeners: ${(0, utils_1.getErrorMessage)(err)}`);
        }
        if (responseMode === 'stream') {
            // Streaming mode: open an SSE channel and let downstream nodes push events through sseStreamer
            // Falls back to synchronous JSON if the chatflow has no streaming-capable end nodes
            const streamable = await chatflows_1.default.checkIfChatflowIsValidForStreaming(req.params.id);
            if (streamable?.isStreaming) {
                const sseStreamer = (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer;
                const chatId = executionChatId;
                req.body.streaming = true;
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('X-Accel-Buffering', 'no');
                res.flushHeaders();
                sseStreamer.addExternalClient(chatId, res);
                try {
                    const apiResponse = await predictions_1.default.buildChatflow(req, Interface_1.ChatType.WEBHOOK);
                    sseStreamer.streamMetadataEvent(chatId, apiResponse);
                }
                catch (err) {
                    sseStreamer.streamErrorEvent(chatId, (0, utils_1.getErrorMessage)(err));
                }
                finally {
                    sseStreamer.removeClient(chatId);
                }
                return;
            }
        }
        if (responseMode === 'async') {
            // Validate the callback URL only when one was provided. Without a URL, the flow runs
            // fire-and-forget — the 202 still goes out, but no callback is delivered when it finishes.
            if (callbackUrl) {
                try {
                    const parsed = new URL(callbackUrl);
                    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
                        throw new Error();
                }
                catch {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid callbackUrl: must be a valid http or https URL`);
                }
            }
            // 202 response and the background execution share the pre-assigned executionChatId
            const chatId = executionChatId;
            res.status(202).json({ chatId, status: 'PROCESSING' });
            setImmediate(async () => {
                try {
                    const apiResponse = await predictions_1.default.buildChatflow(req, Interface_1.ChatType.WEBHOOK);
                    if (!callbackUrl) {
                        (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer.removeClient(chatId);
                        return; // fire-and-forget — no delivery
                    }
                    // apiResponse.action is the parsed humanInputAction — only present when flow is STOPPED (FLOWISE-387)
                    if (apiResponse.action) {
                        await (0, callbackDispatcher_1.dispatchCallback)(callbackUrl, {
                            status: 'STOPPED',
                            chatId,
                            data: { text: apiResponse.text, executionId: apiResponse.executionId, action: apiResponse.action }
                        }, callbackSecret);
                    }
                    else {
                        await (0, callbackDispatcher_1.dispatchCallback)(callbackUrl, { status: 'SUCCESS', chatId, data: apiResponse }, callbackSecret);
                    }
                }
                catch (err) {
                    if (callbackUrl) {
                        await (0, callbackDispatcher_1.dispatchCallback)(callbackUrl, { status: 'ERROR', chatId, error: (0, utils_1.getErrorMessage)(err) }, callbackSecret);
                    }
                    else {
                        logger_1.default.error(`[webhookController] fire-and-forget execution failed for chatId=${chatId}: ${(0, utils_1.getErrorMessage)(err)}`);
                    }
                }
                finally {
                    // Notify webhook listeners that this execution is done; their SSE connections stay open.
                    (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer.removeClient(chatId);
                }
            });
            return;
        }
        try {
            const apiResponse = await predictions_1.default.buildChatflow(req, Interface_1.ChatType.WEBHOOK);
            return res.json(apiResponse);
        }
        finally {
            (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer.removeClient(executionChatId);
        }
    }
    catch (error) {
        next(error);
    }
};
const getRateLimiterMiddleware = async (req, res, next) => {
    try {
        return rateLimit_1.RateLimiterManager.getInstance().getRateLimiter()(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createWebhook,
    getRateLimiterMiddleware
};
//# sourceMappingURL=index.js.map