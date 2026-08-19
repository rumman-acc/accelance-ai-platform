"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const llamaindex_1 = require("llamaindex");
const EngineUtils_1 = require("../EngineUtils");
const EvaluationRunTracerLlama_1 = require("../../../evaluation/EvaluationRunTracerLlama");
class ContextChatEngine_LlamaIndex {
    constructor(fields) {
        this.label = 'Context Chat Engine';
        this.name = 'contextChatEngine';
        this.version = 1.0;
        this.type = 'ContextChatEngine';
        this.icon = 'context-chat-engine.png';
        this.category = 'Engine';
        this.description = 'Answer question based on retrieved documents (context) with built-in memory to remember conversation';
        this.baseClasses = [this.type];
        this.tags = ['LlamaIndex'];
        this.badge = 'DEPRECATING';
        this.deprecateMessage = 'LlamaIndex integration is deprecated and will be removed in a future release.';
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel_LlamaIndex'
            },
            {
                label: 'Vector Store Retriever',
                name: 'vectorStoreRetriever',
                type: 'VectorIndexRetriever'
            },
            {
                label: 'Memory',
                name: 'memory',
                type: 'BaseChatMemory'
            },
            {
                label: 'Return Source Documents',
                name: 'returnSourceDocuments',
                type: 'boolean',
                optional: true
            },
            {
                label: 'System Message',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                optional: true,
                placeholder: 'I want you to act as a document that I am having a conversation with. Your name is "AI Assistant". You will provide me with answers from the given info. If the answer is not included, say exactly "Hmm, I am not sure." and stop after that. Refuse to answer any question not about the info. Never break character.'
            }
        ];
        this.sessionId = fields?.sessionId;
    }
    async init() {
        return null;
    }
    async run(nodeData, input, options) {
        const model = nodeData.inputs?.model;
        const vectorStoreRetriever = nodeData.inputs?.vectorStoreRetriever;
        const systemMessagePrompt = nodeData.inputs?.systemMessagePrompt;
        const memory = nodeData.inputs?.memory;
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments;
        const prependMessages = options?.prependMessages;
        const chatHistory = [];
        if (systemMessagePrompt) {
            chatHistory.push({
                content: systemMessagePrompt,
                role: 'user'
            });
        }
        const chatEngine = new llamaindex_1.ContextChatEngine({ chatModel: model, retriever: vectorStoreRetriever });
        // these are needed for evaluation runs
        await EvaluationRunTracerLlama_1.EvaluationRunTracerLlama.injectEvaluationMetadata(nodeData, options, chatEngine);
        const msgs = (await memory.getChatMessages(this.sessionId, false, prependMessages));
        for (const message of msgs) {
            if (message.type === 'apiMessage') {
                chatHistory.push({
                    content: message.message,
                    role: 'assistant'
                });
            }
            else if (message.type === 'userMessage') {
                chatHistory.push({
                    content: message.message,
                    role: 'user'
                });
            }
        }
        let text = '';
        let isStreamingStarted = false;
        let sourceDocuments = [];
        let sourceNodes = [];
        const shouldStreamResponse = options.shouldStreamResponse;
        const sseStreamer = options.sseStreamer;
        const chatId = options.chatId;
        if (shouldStreamResponse) {
            const stream = await chatEngine.chat({ message: input, chatHistory, stream: true });
            for await (const chunk of stream) {
                text += chunk.response;
                if (chunk.sourceNodes)
                    sourceNodes = chunk.sourceNodes;
                if (!isStreamingStarted) {
                    isStreamingStarted = true;
                    if (sseStreamer) {
                        sseStreamer.streamStartEvent(chatId, chunk.response);
                    }
                }
                if (sseStreamer) {
                    sseStreamer.streamTokenEvent(chatId, chunk.response);
                }
            }
            if (returnSourceDocuments) {
                sourceDocuments = (0, EngineUtils_1.reformatSourceDocuments)(sourceNodes);
                if (sseStreamer) {
                    sseStreamer.streamSourceDocumentsEvent(chatId, sourceDocuments);
                }
            }
        }
        else {
            const response = await chatEngine.chat({ message: input, chatHistory });
            text = response?.response;
            sourceDocuments = (0, EngineUtils_1.reformatSourceDocuments)(response?.sourceNodes ?? []);
        }
        await memory.addChatMessages([
            {
                text: input,
                type: 'userMessage'
            },
            {
                text: text,
                type: 'apiMessage'
            }
        ], this.sessionId);
        if (returnSourceDocuments)
            return { text, sourceDocuments };
        else
            return { text };
    }
}
module.exports = { nodeClass: ContextChatEngine_LlamaIndex };
//# sourceMappingURL=ContextChatEngine.js.map