"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rateLimit_1 = require("../../utils/rateLimit");
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const logger_1 = __importDefault(require("../../utils/logger"));
const predictions_1 = __importDefault(require("../../services/predictions"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const uuid_1 = require("uuid");
const utils_1 = require("../../errors/utils");
const Interface_1 = require("../../Interface");
// Send input message and get prediction result (External)
const createPrediction = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: predictionsController.createPrediction - id not provided!`);
        }
        if (!req.body) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: predictionsController.createPrediction - body not provided!`);
        }
        const workspaceId = req.user?.activeWorkspaceId;
        const chatflow = await chatflows_1.default.getChatflowById(req.params.id, workspaceId);
        if (!chatflow) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${req.params.id} not found`);
        }
        let isDomainAllowed = true;
        let unauthorizedOriginError = 'This site is not allowed to access this chatbot';
        logger_1.default.info(`[server]: Request originated from ${req.headers.origin || 'UNKNOWN ORIGIN'}`);
        if (chatflow.chatbotConfig) {
            const parsedConfig = JSON.parse(chatflow.chatbotConfig);
            // check whether the first one is not empty. if it is empty that means the user set a value and then removed it.
            const isValidAllowedOrigins = parsedConfig.allowedOrigins?.length && parsedConfig.allowedOrigins[0] !== '';
            unauthorizedOriginError = parsedConfig.allowedOriginsError || 'This site is not allowed to access this chatbot';
            if (isValidAllowedOrigins && req.headers.origin) {
                const originHeader = req.headers.origin;
                const origin = new URL(originHeader).host;
                isDomainAllowed =
                    parsedConfig.allowedOrigins.filter((domain) => {
                        try {
                            const allowedOrigin = new URL(domain).host;
                            return origin === allowedOrigin;
                        }
                        catch (e) {
                            return false;
                        }
                    }).length > 0;
            }
        }
        if (isDomainAllowed) {
            const streamable = await chatflows_1.default.checkIfChatflowIsValidForStreaming(req.params.id);
            const isStreamingRequested = req.body.streaming === 'true' || req.body.streaming === true;
            if (streamable?.isStreaming && isStreamingRequested) {
                const sseStreamer = (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer;
                let chatId = req.body.chatId;
                if (!req.body.chatId) {
                    chatId = req.body.chatId ?? req.body.overrideConfig?.sessionId ?? (0, uuid_1.v4)();
                    req.body.chatId = chatId;
                }
                const isQueueMode = process.env.MODE === Interface_1.MODE.QUEUE;
                try {
                    sseStreamer.addExternalClient(chatId, res);
                    res.setHeader('Content-Type', 'text/event-stream');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.setHeader('Connection', 'keep-alive');
                    res.setHeader('X-Accel-Buffering', 'no'); //nginx config: https://serverfault.com/a/801629
                    res.flushHeaders();
                    if (isQueueMode) {
                        await (0, getRunningExpressApp_1.getRunningExpressApp)().redisSubscriber.subscribe(chatId);
                    }
                    const apiResponse = await predictions_1.default.buildChatflow(req);
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
            }
            else {
                const apiResponse = await predictions_1.default.buildChatflow(req);
                return res.json(apiResponse);
            }
        }
        else {
            const isStreamingRequested = req.body.streaming === 'true' || req.body.streaming === true;
            if (isStreamingRequested) {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).send(unauthorizedOriginError);
            }
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, unauthorizedOriginError);
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
    createPrediction,
    getRateLimiterMiddleware
};
//# sourceMappingURL=index.js.map