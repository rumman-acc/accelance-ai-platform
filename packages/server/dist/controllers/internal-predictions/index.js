"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const Interface_1 = require("../../Interface");
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const buildChatflow_1 = require("../../utils/buildChatflow");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
// Send input message and get prediction result (Internal)
const createInternalPrediction = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        const chatflow = await chatflows_1.default.getChatflowByIdForWorkspace(req.params.id, workspaceId);
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${req.params.id} not found`);
        }
        if (req.body.streaming || req.body.streaming === 'true') {
            createAndStreamInternalPrediction(req, res, next);
            return;
        }
        else {
            const apiResponse = await (0, buildChatflow_1.utilBuildChatflow)(req, true);
            if (apiResponse)
                return res.json(apiResponse);
        }
    }
    catch (error) {
        next(error);
    }
};
// Send input message and stream prediction result using SSE (Internal)
const createAndStreamInternalPrediction = async (req, res, next) => {
    const chatId = req.body.chatId;
    const sseStreamer = (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer;
    const isQueueMode = process.env.MODE === Interface_1.MODE.QUEUE;
    try {
        sseStreamer.addClient(chatId, res);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); //nginx config: https://serverfault.com/a/801629
        res.flushHeaders();
        if (isQueueMode) {
            await (0, getRunningExpressApp_1.getRunningExpressApp)().redisSubscriber.subscribe(chatId);
        }
        const apiResponse = await (0, buildChatflow_1.utilBuildChatflow)(req, true);
        sseStreamer.streamMetadataEvent(apiResponse.chatId, apiResponse);
    }
    catch (error) {
        if (chatId) {
            sseStreamer.streamErrorEvent(chatId, (0, utils_1.getErrorMessage)(error));
        }
        next(error);
    }
    finally {
        if (isQueueMode && chatId) {
            await (0, getRunningExpressApp_1.getRunningExpressApp)().redisSubscriber.unsubscribe(chatId);
        }
        sseStreamer.removeClient(chatId);
    }
};
exports.default = {
    createInternalPrediction
};
//# sourceMappingURL=index.js.map