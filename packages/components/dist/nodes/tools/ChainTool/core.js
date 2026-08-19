"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainTool = void 0;
const tools_1 = require("@langchain/core/tools");
const utils_1 = require("../../../src/utils");
const src_1 = require("../../../src");
class ChainTool extends tools_1.DynamicTool {
    constructor({ chain, ...rest }) {
        super({
            ...rest,
            func: async (input, runManager) => {
                // prevent sending SSE events of the sub-chain
                const sseStreamer = runManager?.handlers.find((handler) => handler instanceof src_1.CustomChainHandler)?.sseStreamer;
                if (runManager) {
                    const callbacks = runManager.handlers;
                    for (let i = 0; i < callbacks.length; i += 1) {
                        if (callbacks[i] instanceof src_1.CustomChainHandler) {
                            ;
                            callbacks[i].sseStreamer = undefined;
                        }
                    }
                }
                if (chain.prompt && chain.prompt.promptValues) {
                    const promptValues = (0, utils_1.handleEscapeCharacters)(chain.prompt.promptValues, true);
                    const values = await chain.call(promptValues, runManager?.getChild());
                    if (runManager && sseStreamer) {
                        const callbacks = runManager.handlers;
                        for (let i = 0; i < callbacks.length; i += 1) {
                            if (callbacks[i] instanceof src_1.CustomChainHandler) {
                                ;
                                callbacks[i].sseStreamer = sseStreamer;
                            }
                        }
                    }
                    return values?.text;
                }
                const values = chain.run(input, runManager?.getChild());
                if (runManager && sseStreamer) {
                    const callbacks = runManager.handlers;
                    for (let i = 0; i < callbacks.length; i += 1) {
                        if (callbacks[i] instanceof src_1.CustomChainHandler) {
                            ;
                            callbacks[i].sseStreamer = sseStreamer;
                        }
                    }
                }
                return values;
            }
        });
        this.chain = chain;
    }
}
exports.ChainTool = ChainTool;
//# sourceMappingURL=core.js.map