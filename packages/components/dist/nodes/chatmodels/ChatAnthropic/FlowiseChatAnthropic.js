'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.ChatAnthropic = void 0
const anthropic_1 = require('@langchain/anthropic')
class ChatAnthropic extends anthropic_1.ChatAnthropic {
    constructor(id, fields) {
        // @ts-ignore
        super(fields ?? {})
        this.id = id
        this.configuredModel = fields?.modelName || ''
        this.configuredMaxToken = fields?.maxTokens ?? 2048
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption
    }
}
exports.ChatAnthropic = ChatAnthropic
//# sourceMappingURL=FlowiseChatAnthropic.js.map
