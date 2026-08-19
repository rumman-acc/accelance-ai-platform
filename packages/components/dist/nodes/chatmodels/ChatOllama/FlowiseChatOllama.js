'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.ChatOllama = void 0
const ollama_1 = require('@langchain/ollama')
class ChatOllama extends ollama_1.ChatOllama {
    constructor(id, fields) {
        super(fields)
        this.id = id
        this.configuredModel = fields?.model ?? ''
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption
    }
}
exports.ChatOllama = ChatOllama
//# sourceMappingURL=FlowiseChatOllama.js.map
