"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const webhook_listener_1 = require("../../services/webhook-listener");
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const logger_1 = __importDefault(require("../../utils/logger"));
const HEARTBEAT_MS = 30_000;
const assertChatflowIsWebhookTriggered = async (chatflowid, workspaceId) => {
    const chatflow = await chatflows_1.default.getChatflowById(chatflowid, workspaceId);
    if (!chatflow) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowid} not found`);
    }
    const parsedFlowData = JSON.parse(chatflow.flowData);
    const startNode = parsedFlowData.nodes.find((node) => node.data.name === 'startAgentflow');
    const startInputType = startNode?.data?.inputs?.startInputType;
    if (startInputType !== 'webhookTrigger') {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Chatflow ${chatflowid} is not configured as a webhook trigger`);
    }
};
const registerListener = async (req, res, next) => {
    try {
        const chatflowid = req.params.id;
        if (!chatflowid)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'chatflow id is required');
        await assertChatflowIsWebhookTriggered(chatflowid, req.user?.activeWorkspaceId);
        const registry = (0, webhook_listener_1.getWebhookListenerRegistry)();
        const listenerId = await registry.register(chatflowid);
        return res.json({ listenerId });
    }
    catch (error) {
        next(error);
    }
};
const streamListener = async (req, res, next) => {
    const chatflowid = req.params.id;
    const listenerId = req.params.listenerId;
    try {
        if (!chatflowid || !listenerId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'chatflow id and listener id are required');
        }
        await assertChatflowIsWebhookTriggered(chatflowid, req.user?.activeWorkspaceId);
        const sseStreamer = (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer;
        const registry = (0, webhook_listener_1.getWebhookListenerRegistry)();
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        sseStreamer.addClient(listenerId, res);
        try {
            await registry.heartbeat(chatflowid, listenerId);
        }
        catch (err) {
            logger_1.default.warn(`[webhookListener] Initial heartbeat failed for ${listenerId}: ${err}`);
        }
        // Initial "ready" beacon so the UI can flip from "connecting…" to "listening".
        res.write('message:\ndata:' +
            JSON.stringify({ event: 'listenerReady', data: { listenerId, replicaId: registry.getReplicaId() } }) +
            '\n\n');
        // Heartbeat both keeps the SSE connection alive through proxies AND refreshes the
        // registry TTL so the listener stays discoverable to incoming webhooks.
        const heartbeat = setInterval(() => {
            try {
                res.write(':heartbeat\n\n');
                registry.heartbeat(chatflowid, listenerId).catch(() => { });
            }
            catch {
                /* connection already torn down */
            }
        }, HEARTBEAT_MS);
        req.on('close', async () => {
            clearInterval(heartbeat);
            sseStreamer.removeClient(listenerId);
            try {
                await registry.unregister(chatflowid, listenerId);
            }
            catch (err) {
                logger_1.default.warn(`[webhookListener] Failed to unregister ${listenerId}: ${err}`);
            }
        });
    }
    catch (error) {
        next(error);
    }
};
const unregisterListener = async (req, res, next) => {
    try {
        const chatflowid = req.params.id;
        const listenerId = req.params.listenerId;
        if (!chatflowid || !listenerId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'chatflow id and listener id are required');
        }
        const registry = (0, webhook_listener_1.getWebhookListenerRegistry)();
        await registry.unregister(chatflowid, listenerId);
        return res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
};
exports.default = { registerListener, streamListener, unregisterListener };
//# sourceMappingURL=index.js.map