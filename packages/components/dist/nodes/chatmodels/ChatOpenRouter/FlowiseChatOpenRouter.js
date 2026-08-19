'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.ChatOpenRouter = void 0
const openai_1 = require('@langchain/openai')
class ChatOpenRouter extends openai_1.ChatOpenAI {
    constructor(id, fields) {
        super(fields)
        this.id = id
        this.configuredModel = fields?.modelName ?? ''
        this.configuredMaxToken = fields?.maxTokens
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption
    }
}
exports.ChatOpenRouter = ChatOpenRouter
//# sourceMappingURL=FlowiseChatOpenRouter.js.map
