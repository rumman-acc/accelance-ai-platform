"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chains_1 = require("@langchain/classic/chains");
const handler_1 = require("../../../src/handler");
const utils_1 = require("../../../src/utils");
const Moderation_1 = require("../../moderation/Moderation");
const OutputParserHelpers_1 = require("../../outputparsers/OutputParserHelpers");
class VectorDBQAChain_Chains {
    constructor() {
        this.label = 'VectorDB QA Chain';
        this.name = 'vectorDBQAChain';
        this.version = 2.0;
        this.type = 'VectorDBQAChain';
        this.icon = 'vectordb.svg';
        this.category = 'Chains';
        this.badge = 'DEPRECATING';
        this.description = 'QA chain for vector databases';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(chains_1.VectorDBQAChain)];
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Vector Store',
                name: 'vectorStore',
                type: 'VectorStore'
            },
            {
                label: 'Input Moderation',
                description: 'Detect text that could generate harmful output and prevent it from being sent to the language model',
                name: 'inputModeration',
                type: 'Moderation',
                optional: true,
                list: true
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        const vectorStore = nodeData.inputs?.vectorStore;
        const chain = chains_1.VectorDBQAChain.fromLLM(model, vectorStore, {
            k: vectorStore?.k ?? 4,
            verbose: process.env.DEBUG === 'true' ? true : false
        });
        return chain;
    }
    async run(nodeData, input, options) {
        const chain = nodeData.instance;
        const moderations = nodeData.inputs?.inputModeration;
        const shouldStreamResponse = options.shouldStreamResponse;
        const sseStreamer = options.sseStreamer;
        const chatId = options.chatId;
        if (moderations && moderations.length > 0) {
            try {
                // Use the output of the moderation chain as input for the VectorDB QA Chain
                input = await (0, Moderation_1.checkInputs)(moderations, input);
            }
            catch (e) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                // if (options.shouldStreamResponse) {
                //     streamResponse(options.sseStreamer, options.chatId, e.message)
                // }
                return (0, OutputParserHelpers_1.formatResponse)(e.message);
            }
        }
        const obj = {
            query: input
        };
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger, options?.orgId);
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        if (shouldStreamResponse) {
            const handler = new handler_1.CustomChainHandler(sseStreamer, chatId);
            const res = await chain.call(obj, [loggerHandler, handler, ...callbacks]);
            return res?.text;
        }
        else {
            const res = await chain.call(obj, [loggerHandler, ...callbacks]);
            return res?.text;
        }
    }
}
module.exports = { nodeClass: VectorDBQAChain_Chains };
//# sourceMappingURL=VectorDBQAChain.js.map