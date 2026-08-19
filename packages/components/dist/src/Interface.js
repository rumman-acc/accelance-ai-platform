'use strict'
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              var desc = Object.getOwnPropertyDescriptor(m, k)
              if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
                  desc = {
                      enumerable: true,
                      get: function () {
                          return m[k]
                      }
                  }
              }
              Object.defineProperty(o, k2, desc)
          }
        : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              o[k2] = m[k]
          })
var __exportStar =
    (this && this.__exportStar) ||
    function (m, exports) {
        for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p)
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.FollowUpPromptProvider =
    exports.FlowiseSummaryBufferMemory =
    exports.FlowiseSummaryMemory =
    exports.FlowiseWindowMemory =
    exports.FlowiseMemory =
    exports.VectorStoreRetriever =
    exports.PromptRetriever =
    exports.PromptTemplate =
    exports.VALID_CLIENT_TYPES =
        void 0
const memory_1 = require('@langchain/classic/memory')
exports.VALID_CLIENT_TYPES = new Set(['agentflowv2', 'agentflowsdk'])
/**
 * Classes
 */
const prompts_1 = require('@langchain/core/prompts')
class PromptTemplate extends prompts_1.PromptTemplate {
    constructor(input) {
        super(input)
    }
}
exports.PromptTemplate = PromptTemplate
const fixedTemplate = `Here is a question:
{input}
`
class PromptRetriever {
    constructor(fields) {
        this.name = fields.name
        this.description = fields.description
        this.systemMessage = `${fields.systemMessage}\n${fixedTemplate}`
    }
}
exports.PromptRetriever = PromptRetriever
class VectorStoreRetriever {
    constructor(fields) {
        this.name = fields.name
        this.description = fields.description
        this.vectorStore = fields.vectorStore
    }
}
exports.VectorStoreRetriever = VectorStoreRetriever
class FlowiseMemory extends memory_1.BufferMemory {}
exports.FlowiseMemory = FlowiseMemory
class FlowiseWindowMemory extends memory_1.BufferWindowMemory {}
exports.FlowiseWindowMemory = FlowiseWindowMemory
class FlowiseSummaryMemory extends memory_1.ConversationSummaryMemory {}
exports.FlowiseSummaryMemory = FlowiseSummaryMemory
class FlowiseSummaryBufferMemory extends memory_1.ConversationSummaryBufferMemory {}
exports.FlowiseSummaryBufferMemory = FlowiseSummaryBufferMemory
__exportStar(require('./Interface.Evaluation'), exports)
var FollowUpPromptProvider
;(function (FollowUpPromptProvider) {
    FollowUpPromptProvider['ANTHROPIC'] = 'chatAnthropic'
    FollowUpPromptProvider['AZURE_OPENAI'] = 'azureChatOpenAI'
    FollowUpPromptProvider['GOOGLE_GENAI'] = 'chatGoogleGenerativeAI'
    FollowUpPromptProvider['MISTRALAI'] = 'chatMistralAI'
    FollowUpPromptProvider['OPENAI'] = 'chatOpenAI'
    FollowUpPromptProvider['GROQ'] = 'groqChat'
    FollowUpPromptProvider['OLLAMA'] = 'ollama'
})(FollowUpPromptProvider || (exports.FollowUpPromptProvider = FollowUpPromptProvider = {}))
//# sourceMappingURL=Interface.js.map
