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
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function (o, v) {
              Object.defineProperty(o, 'default', { enumerable: true, value: v })
          }
        : function (o, v) {
              o['default'] = v
          })
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) return mod
        var result = {}
        if (mod != null)
            for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)
        __setModuleDefault(result, mod)
        return result
    }
Object.defineProperty(exports, '__esModule', { value: true })
const messages_1 = require('@langchain/core/messages')
const prompt_1 = require('../prompt')
const utils_1 = require('../../../src/utils')
class HumanInput_Agentflow {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels(_, options) {
                const componentNodes = options.componentNodes
                const returnOptions = []
                for (const nodeName in componentNodes) {
                    const componentNode = componentNodes[nodeName]
                    if (componentNode.category === 'Chat Models') {
                        if (componentNode.tags?.includes('LlamaIndex')) {
                            continue
                        }
                        returnOptions.push({
                            label: componentNode.label,
                            name: nodeName,
                            imageSrc: componentNode.icon
                        })
                    }
                }
                return returnOptions
            }
        }
        this.label = 'Human Input'
        this.name = 'humanInputAgentflow'
        this.version = 1.0
        this.type = 'HumanInput'
        this.category = 'Agent Flows'
        this.description = 'Request human input, approval or rejection during execution'
        this.color = '#6E6EFD'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Description Type',
                name: 'humanInputDescriptionType',
                type: 'options',
                options: [
                    {
                        label: 'Fixed',
                        name: 'fixed',
                        description: 'Specify a fixed description'
                    },
                    {
                        label: 'Dynamic',
                        name: 'dynamic',
                        description: 'Use LLM to generate a description'
                    }
                ]
            },
            {
                label: 'Description',
                name: 'humanInputDescription',
                type: 'string',
                placeholder: 'Are you sure you want to proceed?',
                acceptVariable: true,
                rows: 4,
                show: {
                    humanInputDescriptionType: 'fixed'
                }
            },
            {
                label: 'Model',
                name: 'humanInputModel',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                loadConfig: true,
                show: {
                    humanInputDescriptionType: 'dynamic'
                }
            },
            {
                label: 'Prompt',
                name: 'humanInputModelPrompt',
                type: 'string',
                default: prompt_1.DEFAULT_HUMAN_INPUT_DESCRIPTION_HTML,
                acceptVariable: true,
                generateInstruction: true,
                rows: 4,
                show: {
                    humanInputDescriptionType: 'dynamic'
                }
            },
            {
                label: 'Enable Feedback',
                name: 'humanInputEnableFeedback',
                type: 'boolean',
                default: true
            }
        ]
        this.outputs = [
            {
                label: 'Proceed',
                name: 'proceed'
            },
            {
                label: 'Reject',
                name: 'reject'
            }
        ]
    }
    async run(nodeData, _, options) {
        const _humanInput = nodeData.inputs?.humanInput
        const humanInput = typeof _humanInput === 'string' ? JSON.parse(_humanInput) : _humanInput
        const humanInputEnableFeedback = nodeData.inputs?.humanInputEnableFeedback
        let humanInputDescriptionType = nodeData.inputs?.humanInputDescriptionType
        const model = nodeData.inputs?.humanInputModel
        const modelConfig = nodeData.inputs?.humanInputModelConfig
        const _humanInputModelPrompt = nodeData.inputs?.humanInputModelPrompt
        const humanInputModelPrompt = _humanInputModelPrompt ? _humanInputModelPrompt : prompt_1.DEFAULT_HUMAN_INPUT_DESCRIPTION
        // Extract runtime state and history
        const state = options.agentflowRuntime?.state
        const pastChatHistory = options.pastChatHistory ?? []
        const runtimeChatHistory = options.agentflowRuntime?.chatHistory ?? []
        const chatId = options.chatId
        const isStreamable = options.sseStreamer !== undefined
        if (humanInput) {
            const outcomes = [
                {
                    type: 'proceed',
                    startNodeId: humanInput?.startNodeId,
                    feedback: humanInputEnableFeedback && humanInput?.feedback ? humanInput.feedback : undefined,
                    isFulfilled: false
                },
                {
                    type: 'reject',
                    startNodeId: humanInput?.startNodeId,
                    feedback: humanInputEnableFeedback && humanInput?.feedback ? humanInput.feedback : undefined,
                    isFulfilled: false
                }
            ]
            // Only one outcome can be fulfilled at a time
            switch (humanInput?.type) {
                case 'proceed':
                    outcomes[0].isFulfilled = true
                    break
                case 'reject':
                    outcomes[1].isFulfilled = true
                    break
            }
            const messages = [
                ...pastChatHistory,
                ...runtimeChatHistory,
                {
                    role: 'user',
                    content: humanInput.feedback || humanInput.type
                }
            ]
            const input = { ...humanInput, messages }
            const output = { content: humanInput.feedback || humanInput.type, conditions: outcomes }
            const nodeOutput = {
                id: nodeData.id,
                name: this.name,
                input,
                output,
                state
            }
            if (humanInput.feedback) {
                nodeOutput.chatHistory = [{ role: 'user', content: humanInput.feedback }]
            }
            return nodeOutput
        } else {
            let humanInputDescription = ''
            if (humanInputDescriptionType === 'fixed') {
                humanInputDescription = nodeData.inputs?.humanInputDescription || 'Do you want to proceed?'
                const messages = [...pastChatHistory, ...runtimeChatHistory]
                // Find the last message in the messages array
                const lastMessage = messages.length > 0 ? messages[messages.length - 1].content || '' : ''
                humanInputDescription = `${lastMessage}\n\n${humanInputDescription}`
                if (isStreamable) {
                    const sseStreamer = options.sseStreamer
                    sseStreamer.streamTokenEvent(chatId, humanInputDescription)
                }
            } else {
                if (model && modelConfig) {
                    const nodeInstanceFilePath = options.componentNodes[model].filePath
                    const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
                    const newNodeInstance = new nodeModule.nodeClass()
                    const newNodeData = {
                        ...nodeData,
                        credential: modelConfig['FLOWISE_CREDENTIAL_ID'],
                        inputs: {
                            ...nodeData.inputs,
                            ...modelConfig
                        }
                    }
                    const llmNodeInstance = await newNodeInstance.init(newNodeData, '', options)
                    const messages = [
                        ...pastChatHistory,
                        ...runtimeChatHistory,
                        {
                            role: 'user',
                            content: humanInputModelPrompt || prompt_1.DEFAULT_HUMAN_INPUT_DESCRIPTION
                        }
                    ]
                    let response = new messages_1.AIMessageChunk('')
                    if (isStreamable) {
                        const sseStreamer = options.sseStreamer
                        for await (const chunk of await llmNodeInstance.stream(messages)) {
                            const content = typeof chunk === 'string' ? chunk : chunk.content.toString()
                            sseStreamer.streamTokenEvent(chatId, content)
                            const messageChunk = typeof chunk === 'string' ? new messages_1.AIMessageChunk(chunk) : chunk
                            response = response.concat(messageChunk)
                        }
                        humanInputDescription = response.content
                    } else {
                        const response = await llmNodeInstance.invoke(messages)
                        humanInputDescription = (0, utils_1.extractResponseContent)(response)
                    }
                }
            }
            const input = { messages: [...pastChatHistory, ...runtimeChatHistory], humanInputEnableFeedback }
            const output = { content: humanInputDescription }
            const nodeOutput = {
                id: nodeData.id,
                name: this.name,
                input,
                output,
                state,
                chatHistory: [{ role: 'assistant', content: humanInputDescription }]
            }
            return nodeOutput
        }
    }
}
module.exports = { nodeClass: HumanInput_Agentflow }
//# sourceMappingURL=HumanInput.js.map
