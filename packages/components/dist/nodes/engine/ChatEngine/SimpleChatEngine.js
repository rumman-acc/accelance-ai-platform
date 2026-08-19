'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const llamaindex_1 = require('llamaindex')
const EvaluationRunTracerLlama_1 = require('../../../evaluation/EvaluationRunTracerLlama')
class SimpleChatEngine_LlamaIndex {
    constructor(fields) {
        this.label = 'Simple Chat Engine'
        this.name = 'simpleChatEngine'
        this.version = 1.0
        this.type = 'SimpleChatEngine'
        this.icon = 'chat-engine.png'
        this.category = 'Engine'
        this.description = 'Simple engine to handle back and forth conversations'
        this.baseClasses = [this.type]
        this.tags = ['LlamaIndex']
        this.badge = 'DEPRECATING'
        this.deprecateMessage = 'LlamaIndex integration is deprecated and will be removed in a future release.'
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel_LlamaIndex'
            },
            {
                label: 'Memory',
                name: 'memory',
                type: 'BaseChatMemory'
            },
            {
                label: 'System Message',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                optional: true,
                placeholder: 'You are a helpful assistant'
            }
        ]
        this.sessionId = fields?.sessionId
    }
    async init() {
        return null
    }
    async run(nodeData, input, options) {
        const model = nodeData.inputs?.model
        const systemMessagePrompt = nodeData.inputs?.systemMessagePrompt
        const memory = nodeData.inputs?.memory
        const prependMessages = options?.prependMessages
        const chatHistory = []
        if (systemMessagePrompt) {
            chatHistory.push({
                content: systemMessagePrompt,
                role: 'user'
            })
        }
        const chatEngine = new llamaindex_1.SimpleChatEngine({ llm: model })
        // these are needed for evaluation runs
        await EvaluationRunTracerLlama_1.EvaluationRunTracerLlama.injectEvaluationMetadata(nodeData, options, chatEngine)
        const msgs = await memory.getChatMessages(this.sessionId, false, prependMessages)
        for (const message of msgs) {
            if (message.type === 'apiMessage') {
                chatHistory.push({
                    content: message.message,
                    role: 'assistant'
                })
            } else if (message.type === 'userMessage') {
                chatHistory.push({
                    content: message.message,
                    role: 'user'
                })
            }
        }
        let text = ''
        let isStreamingStarted = false
        const shouldStreamResponse = options.shouldStreamResponse
        const sseStreamer = options.sseStreamer
        const chatId = options.chatId
        if (shouldStreamResponse) {
            const stream = await chatEngine.chat({ message: input, chatHistory, stream: true })
            for await (const chunk of stream) {
                text += chunk.response
                if (!isStreamingStarted) {
                    isStreamingStarted = true
                    if (sseStreamer) {
                        sseStreamer.streamStartEvent(chatId, chunk.response)
                    }
                }
                if (sseStreamer) {
                    sseStreamer.streamTokenEvent(chatId, chunk.response)
                }
            }
        } else {
            const response = await chatEngine.chat({ message: input, chatHistory })
            text = response?.response
        }
        await memory.addChatMessages(
            [
                {
                    text: input,
                    type: 'userMessage'
                },
                {
                    text: text,
                    type: 'apiMessage'
                }
            ],
            this.sessionId
        )
        return text
    }
}
module.exports = { nodeClass: SimpleChatEngine_LlamaIndex }
//# sourceMappingURL=SimpleChatEngine.js.map
