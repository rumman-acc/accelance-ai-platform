"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const accelance_components_1 = require("accelance-components");
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const text_to_speech_1 = __importDefault(require("../../services/text-to-speech"));
const utils_1 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const generateTextToSpeech = async (req, res) => {
    try {
        const { chatId, chatflowId, chatMessageId, text, provider: bodyProvider, credentialId: bodyCredentialId, voice: bodyVoice, model: bodyModel } = req.body;
        if (!text) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: textToSpeechController.generateTextToSpeech - text not provided!`);
        }
        let provider, credentialId, voice, model;
        if (chatflowId) {
            let workspaceId = req.user?.activeWorkspaceId;
            let chatflow;
            if (workspaceId) {
                chatflow = await chatflows_1.default.getChatflowById(chatflowId, workspaceId);
            }
            else {
                // Fallback: get workspaceId from chatflow when req.user.activeWorkspaceId is not set (from whitelist API)
                chatflow = await chatflows_1.default.getChatflowById(chatflowId);
                workspaceId = chatflow.workspaceId;
            }
            if (!workspaceId) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Error: textToSpeechController.generateTextToSpeech - workspace not found!`);
            }
            // Get TTS config from chatflow
            const ttsConfig = JSON.parse(chatflow.textToSpeech);
            // Find the provider with status: true
            const activeProviderKey = Object.keys(ttsConfig).find((key) => ttsConfig[key].status === true);
            if (!activeProviderKey) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: textToSpeechController.generateTextToSpeech - no active TTS provider configured in chatflow!`);
            }
            const providerConfig = ttsConfig[activeProviderKey];
            provider = activeProviderKey;
            credentialId = providerConfig.credentialId;
            voice = providerConfig.voice;
            model = providerConfig.model;
        }
        else {
            // Use TTS config from request body
            provider = bodyProvider;
            credentialId = bodyCredentialId;
            voice = bodyVoice;
            model = bodyModel;
        }
        if (!provider) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: textToSpeechController.generateTextToSpeech - provider not provided!`);
        }
        if (!credentialId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: textToSpeechController.generateTextToSpeech - credentialId not provided!`);
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const options = {
            orgId: '',
            chatflowid: chatflowId || '',
            chatId: chatId || '',
            appDataSource: appServer.AppDataSource,
            databaseEntities: utils_1.databaseEntities
        };
        const textToSpeechConfig = {
            name: provider,
            credentialId: credentialId,
            voice: voice,
            model: model
        };
        // Create and store AbortController
        const abortController = new AbortController();
        const ttsAbortId = `tts_${chatId}_${chatMessageId}`;
        appServer.abortControllerPool.add(ttsAbortId, abortController);
        try {
            await (0, accelance_components_1.convertTextToSpeechStream)(text, textToSpeechConfig, options, abortController, (format) => {
                const startResponse = {
                    event: 'tts_start',
                    data: { chatMessageId, format }
                };
                res.write('event: tts_start\n');
                res.write(`data: ${JSON.stringify(startResponse)}\n\n`);
            }, (chunk) => {
                const audioBase64 = chunk.toString('base64');
                const clientResponse = {
                    event: 'tts_data',
                    data: { chatMessageId, audioChunk: audioBase64 }
                };
                res.write('event: tts_data\n');
                res.write(`data: ${JSON.stringify(clientResponse)}\n\n`);
            }, async () => {
                const endResponse = {
                    event: 'tts_end',
                    data: { chatMessageId }
                };
                res.write('event: tts_end\n');
                res.write(`data: ${JSON.stringify(endResponse)}\n\n`);
                res.end();
                // Clean up from pool on successful completion
                appServer.abortControllerPool.remove(ttsAbortId);
            });
        }
        catch (error) {
            // Clean up from pool on error
            appServer.abortControllerPool.remove(ttsAbortId);
            throw error;
        }
    }
    catch (error) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        }
        const errorResponse = {
            event: 'tts_error',
            data: { error: error instanceof Error ? error.message : 'TTS generation failed' }
        };
        res.write('event: tts_error\n');
        res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
        res.end();
    }
};
const abortTextToSpeech = async (req, res) => {
    try {
        const { chatId, chatMessageId, chatflowId } = req.body;
        if (!chatId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: textToSpeechController.abortTextToSpeech - chatId not provided!`);
        }
        if (!chatMessageId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: textToSpeechController.abortTextToSpeech - chatMessageId not provided!`);
        }
        if (!chatflowId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: textToSpeechController.abortTextToSpeech - chatflowId not provided!`);
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // Abort the TTS generation using existing pool
        const ttsAbortId = `tts_${chatId}_${chatMessageId}`;
        appServer.abortControllerPool.abort(ttsAbortId);
        // Also abort the main chat flow AbortController for auto-TTS
        const chatFlowAbortId = `${chatflowId}_${chatId}`;
        if (appServer.abortControllerPool.get(chatFlowAbortId)) {
            appServer.abortControllerPool.abort(chatFlowAbortId);
            appServer.sseStreamer.streamMetadataEvent(chatId, { chatId, chatMessageId });
        }
        // Send abort event to client
        appServer.sseStreamer.streamTTSAbortEvent(chatId, chatMessageId);
        res.json({ message: 'TTS stream aborted successfully', chatId, chatMessageId });
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to abort TTS stream'
        });
    }
};
const getVoices = async (req, res, next) => {
    try {
        const { provider, credentialId } = req.query;
        if (!provider) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Error: textToSpeechController.getVoices - provider not provided!`);
        }
        const voices = await text_to_speech_1.default.getVoices(provider, credentialId);
        return res.json(voices);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    generateTextToSpeech,
    abortTextToSpeech,
    getVoices
};
//# sourceMappingURL=index.js.map