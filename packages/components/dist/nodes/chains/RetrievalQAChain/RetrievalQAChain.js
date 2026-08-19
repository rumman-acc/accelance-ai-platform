'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const chains_1 = require('@langchain/classic/chains')
const handler_1 = require('../../../src/handler')
const utils_1 = require('../../../src/utils')
const Moderation_1 = require('../../moderation/Moderation')
const OutputParserHelpers_1 = require('../../outputparsers/OutputParserHelpers')
class RetrievalQAChain_Chains {
    constructor() {
        this.label = 'Retrieval QA Chain'
        this.name = 'retrievalQAChain'
        this.version = 2.0
        this.type = 'RetrievalQAChain'
        this.icon = 'qa.svg'
        this.badge = 'DEPRECATING'
        this.category = 'Chains'
        this.description = 'QA chain to answer a question based on the retrieved documents'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(chains_1.RetrievalQAChain)]
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Vector Store Retriever',
                name: 'vectorStoreRetriever',
                type: 'BaseRetriever'
            },
            {
                label: 'Input Moderation',
                description: 'Detect text that could generate harmful output and prevent it from being sent to the language model',
                name: 'inputModeration',
                type: 'Moderation',
                optional: true,
                list: true
            }
        ]
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model
        const vectorStoreRetriever = nodeData.inputs?.vectorStoreRetriever
        const chain = chains_1.RetrievalQAChain.fromLLM(model, vectorStoreRetriever, {
            verbose: process.env.DEBUG === 'true' ? true : false
        })
        return chain
    }
    async run(nodeData, input, options) {
        const chain = nodeData.instance
        const moderations = nodeData.inputs?.inputModeration
        const shouldStreamResponse = options.shouldStreamResponse
        const sseStreamer = options.sseStreamer
        const chatId = options.chatId
        if (moderations && moderations.length > 0) {
            try {
                // Use the output of the moderation chain as input for the Retrieval QA Chain
                input = await (0, Moderation_1.checkInputs)(moderations, input)
            } catch (e) {
                await new Promise((resolve) => setTimeout(resolve, 500))
                if (shouldStreamResponse) {
                    ;(0, Moderation_1.streamResponse)(sseStreamer, chatId, e.message)
                }
                return (0, OutputParserHelpers_1.formatResponse)(e.message)
            }
        }
        const obj = {
            query: input
        }
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger, options?.orgId)
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options)
        if (shouldStreamResponse) {
            const handler = new handler_1.CustomChainHandler(sseStreamer, chatId)
            const res = await chain.call(obj, [loggerHandler, handler, ...callbacks])
            return res?.text
        } else {
            const res = await chain.call(obj, [loggerHandler, ...callbacks])
            return res?.text
        }
    }
}
module.exports = { nodeClass: RetrievalQAChain_Chains }
//# sourceMappingURL=RetrievalQAChain.js.map
