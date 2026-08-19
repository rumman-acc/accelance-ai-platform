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
const utils_1 = require('../utils')
const prompt_1 = require('../prompt')
const matchScenario_1 = require('./matchScenario')
const utils_2 = require('../../../src/utils')
const modelLoader_1 = require('../../../src/modelLoader')
const node_html_markdown_1 = require('node-html-markdown')
class ConditionAgent_Agentflow {
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
        this.label = 'Condition Agent'
        this.name = 'conditionAgentAgentflow'
        this.version = 2.0
        this.type = 'ConditionAgent'
        this.category = 'Agent Flows'
        this.description = `Utilize an agent to split flows based on dynamic conditions`
        this.baseClasses = [this.type]
        this.color = '#ff8fab'
        this.inputs = [
            {
                label: 'Model',
                name: 'conditionAgentModel',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                loadConfig: true
            },
            {
                label: 'Instructions',
                name: 'conditionAgentInstructions',
                type: 'string',
                description: 'A general instructions of what the condition agent should do',
                rows: 4,
                acceptVariable: true,
                placeholder: 'Determine if the user is interested in learning about AI'
            },
            {
                label: 'Input',
                name: 'conditionAgentInput',
                type: 'string',
                description: 'Input to be used for the condition agent',
                rows: 4,
                acceptVariable: true,
                default: '<p><span class="variable" data-type="mention" data-id="question" data-label="question">{{ question }}</span> </p>'
            },
            {
                label: 'Scenarios',
                name: 'conditionAgentScenarios',
                description: 'Define the scenarios that will be used as the conditions to split the flow',
                type: 'array',
                array: [
                    {
                        label: 'Scenario',
                        name: 'scenario',
                        type: 'string',
                        placeholder: 'User is asking for a pizza'
                    }
                ],
                minItems: 1,
                default: [
                    {
                        scenario: ''
                    },
                    {
                        scenario: ''
                    }
                ]
            },
            {
                label: 'Enable Memory',
                name: 'conditionAgentEnableMemory',
                type: 'boolean',
                description: 'Enable memory for the conversation thread',
                default: true,
                optional: true
            },
            {
                label: 'Memory Type',
                name: 'conditionAgentMemoryType',
                type: 'options',
                options: [
                    {
                        label: 'All Messages',
                        name: 'allMessages',
                        description: 'Retrieve all messages from the conversation'
                    },
                    {
                        label: 'Window Size',
                        name: 'windowSize',
                        description: 'Uses a fixed window size to surface the last N messages'
                    },
                    {
                        label: 'Conversation Summary',
                        name: 'conversationSummary',
                        description: 'Summarizes the whole conversation'
                    },
                    {
                        label: 'Conversation Summary Buffer',
                        name: 'conversationSummaryBuffer',
                        description: 'Summarize conversations once token limit is reached. Default to 2000'
                    }
                ],
                optional: true,
                default: 'allMessages',
                show: {
                    conditionAgentEnableMemory: true
                }
            },
            {
                label: 'Window Size',
                name: 'conditionAgentMemoryWindowSize',
                type: 'number',
                default: '20',
                description: 'Uses a fixed window size to surface the last N messages',
                show: {
                    conditionAgentMemoryType: 'windowSize'
                }
            },
            {
                label: 'Max Token Limit',
                name: 'conditionAgentMemoryMaxTokenLimit',
                type: 'number',
                default: '2000',
                description: 'Summarize conversations once token limit is reached. Default to 2000',
                show: {
                    conditionAgentMemoryType: 'conversationSummaryBuffer'
                }
            },
            {
                label: 'Override System Prompt',
                name: 'conditionAgentOverrideSystemPrompt',
                type: 'boolean',
                description: 'Override initial system prompt for Condition Agent',
                optional: true
            },
            {
                label: 'Condition Agent System Prompt',
                name: 'conditionAgentSystemPrompt',
                type: 'string',
                rows: 4,
                optional: true,
                acceptVariable: true,
                default: prompt_1.CONDITION_AGENT_SYSTEM_PROMPT,
                description: 'Expert use only. Modifying this can significantly alter agent behavior. Leave default if unsure',
                show: {
                    conditionAgentOverrideSystemPrompt: true
                }
            }
        ]
        this.outputs = [
            {
                label: '0',
                name: '0',
                description: 'Condition 0'
            },
            {
                label: '1',
                name: '1',
                description: 'Else'
            }
        ]
    }
    parseJsonMarkdown(jsonString) {
        // Strip whitespace
        jsonString = jsonString.trim()
        const starts = ['```json', '```', '``', '`', '{']
        const ends = ['```', '``', '`', '}']
        let startIndex = -1
        let endIndex = -1
        // Find start of JSON
        for (const s of starts) {
            startIndex = jsonString.indexOf(s)
            if (startIndex !== -1) {
                if (jsonString[startIndex] !== '{') {
                    startIndex += s.length
                }
                break
            }
        }
        // Find end of JSON
        if (startIndex !== -1) {
            for (const e of ends) {
                endIndex = jsonString.lastIndexOf(e, jsonString.length)
                if (endIndex !== -1) {
                    if (jsonString[endIndex] === '}') {
                        endIndex += 1
                    }
                    break
                }
            }
        }
        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            const extractedContent = jsonString.slice(startIndex, endIndex).trim()
            try {
                return JSON.parse(extractedContent)
            } catch (error) {
                throw new Error(`Invalid JSON object. Error: ${error}`)
            }
        }
        throw new Error('Could not find JSON block in the output.')
    }
    async run(nodeData, question, options) {
        let llmIds
        let analyticHandlers = options.analyticHandlers
        try {
            const abortController = options.abortController
            // Extract input parameters
            const model = nodeData.inputs?.conditionAgentModel
            const modelConfig = nodeData.inputs?.conditionAgentModelConfig
            if (!model) {
                throw new Error('Model is required')
            }
            const modelName = modelConfig?.model ?? modelConfig?.modelName
            const conditionAgentInput = nodeData.inputs?.conditionAgentInput
            let input = conditionAgentInput || question
            const conditionAgentInstructions = nodeData.inputs?.conditionAgentInstructions
            const conditionAgentSystemPrompt = nodeData.inputs?.conditionAgentSystemPrompt
            const conditionAgentOverrideSystemPrompt = nodeData.inputs?.conditionAgentOverrideSystemPrompt
            let systemPrompt = node_html_markdown_1.NodeHtmlMarkdown.translate(prompt_1.CONDITION_AGENT_SYSTEM_PROMPT)
            if (conditionAgentSystemPrompt && conditionAgentOverrideSystemPrompt) {
                systemPrompt = conditionAgentSystemPrompt
            }
            // Extract memory and configuration options
            const enableMemory = nodeData.inputs?.conditionAgentEnableMemory
            const memoryType = nodeData.inputs?.conditionAgentMemoryType
            const _conditionAgentScenarios = nodeData.inputs?.conditionAgentScenarios
            // Extract runtime state and history
            const state = options.agentflowRuntime?.state
            const pastChatHistory = options.pastChatHistory ?? []
            const runtimeChatHistory = options.agentflowRuntime?.chatHistory ?? []
            const prependedChatHistory = options.prependedChatHistory
            // Initialize the LLM model instance
            const nodeInstanceFilePath = options.componentNodes[model].filePath
            const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
            const newLLMNodeInstance = new nodeModule.nodeClass()
            const newNodeData = {
                ...nodeData,
                credential: modelConfig['FLOWISE_CREDENTIAL_ID'],
                inputs: {
                    ...nodeData.inputs,
                    ...modelConfig
                }
            }
            let llmNodeInstance = await newLLMNodeInstance.init(newNodeData, '', options)
            const isStructuredOutput =
                _conditionAgentScenarios && Array.isArray(_conditionAgentScenarios) && _conditionAgentScenarios.length > 0
            if (!isStructuredOutput) {
                throw new Error('Scenarios are required')
            }
            // Prepare prefix messages (system prompt + few-shot examples) - needed for model invocation only
            const prefixMessages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `{"input": "Hello", "scenarios": ["user is asking about AI", "user is not asking about AI"], "instruction": "Your task is to check if the user is asking about AI."}`
                },
                {
                    role: 'assistant',
                    content: `\`\`\`json\n{"output": "user is not asking about AI"}\n\`\`\``
                }
            ]
            // Prepare messages array (these get stored in output)
            const messages = []
            // Prepend history ONLY if it is the first node
            if (prependedChatHistory.length > 0 && !runtimeChatHistory.length) {
                for (const msg of prependedChatHistory) {
                    const role = msg.role === 'apiMessage' ? 'assistant' : 'user'
                    const content = msg.content ?? ''
                    messages.push({
                        role,
                        content
                    })
                }
            }
            const scenariosList = _conditionAgentScenarios.map((scenario, index) => `${index + 1}. ${scenario.scenario}`).join('\n')
            const prettyInput = `### Input\n${input}\n\n### Scenarios\n${scenariosList}\n\n### Instruction\n${conditionAgentInstructions}`
            input = `{"input": ${input}, "scenarios": ${JSON.stringify(
                _conditionAgentScenarios.map((scenario) => scenario.scenario)
            )}, "instruction": ${conditionAgentInstructions}}`
            // Handle memory management if enabled
            if (enableMemory) {
                await this.handleMemory({
                    messages,
                    memoryType,
                    pastChatHistory,
                    runtimeChatHistory,
                    llmNodeInstance,
                    nodeData,
                    input,
                    abortController,
                    options,
                    modelConfig
                })
            } else {
                /*
                 * If this is the first node:
                 * - Add images to messages if exist
                 */
                if (!runtimeChatHistory.length && options.uploads) {
                    const imageContents = await (0, utils_1.getUniqueImageMessages)(options, messages, modelConfig)
                    if (imageContents) {
                        messages.push(imageContents.imageMessageWithBase64)
                    }
                }
                messages.push({
                    role: 'user',
                    content: input
                })
            }
            // Initialize response and determine if streaming is possible
            let response = new messages_1.AIMessageChunk('')
            // Combine prefix messages with regular messages for model invocation
            const allMessages = [...prefixMessages, ...messages]
            // Start analytics
            if (analyticHandlers && options.parentTraceIds) {
                const llmLabel = options?.componentNodes?.[model]?.label || model
                llmIds = await analyticHandlers.onLLMStart(llmLabel, allMessages, options.parentTraceIds)
            }
            // Track execution time
            const startTime = Date.now()
            response = await llmNodeInstance.invoke(allMessages, { signal: abortController?.signal })
            // Calculate execution time
            const endTime = Date.now()
            const timeDelta = endTime - startTime
            const responseContent = (0, utils_2.extractResponseContent)(response)
            // End analytics tracking (pass structured output with usage metadata)
            if (analyticHandlers && llmIds) {
                const analyticsOutput = {
                    content: responseContent
                }
                // Include usage metadata if available
                if (response.usage_metadata) {
                    analyticsOutput.usageMetadata = response.usage_metadata
                }
                // Include response metadata (contains model name) if available
                if (response.response_metadata) {
                    analyticsOutput.responseMetadata = response.response_metadata
                }
                await analyticHandlers.onLLMEnd(llmIds, analyticsOutput, { model: modelName, provider: model })
            }
            let calledOutputName
            try {
                const parsedResponse = this.parseJsonMarkdown(responseContent)
                if (!parsedResponse.output || typeof parsedResponse.output !== 'string') {
                    throw new Error('LLM response is missing the "output" key or it is not a string.')
                }
                calledOutputName = parsedResponse.output
            } catch (error) {
                throw new Error(
                    `Failed to parse a valid scenario from the LLM's response. Please check if the model is capable of following JSON output instructions. Raw LLM Response: "${responseContent}"`
                )
            }
            // Clean up empty inputs
            for (const key in nodeData.inputs) {
                if (nodeData.inputs[key] === '') {
                    delete nodeData.inputs[key]
                }
            }
            const matchedScenarioIndex = (0, matchScenario_1.findBestScenarioIndex)(_conditionAgentScenarios, calledOutputName)
            const conditions = _conditionAgentScenarios.map((scenario, index) => {
                return {
                    output: scenario.scenario,
                    isFulfilled: index === matchedScenarioIndex
                }
            })
            // Revert all tagged base64 image_url items back to stored-file format
            const messagesWithFileReferences = (0, utils_1.revertBase64ImagesToFileRefs)(messages)
            // Replace the user input with prettified input for display purposes
            for (let i = messagesWithFileReferences.length - 1; i >= 0; i--) {
                const msg = messagesWithFileReferences[i]
                if (msg.role === 'user' && msg.content === input) {
                    msg.content = prettyInput
                    break
                }
            }
            // Only add to runtime chat history if this is the first node
            const inputMessages = []
            if (!runtimeChatHistory.length) {
                const imageInputMessages = messagesWithFileReferences.filter(
                    (msg) =>
                        msg.role === 'user' &&
                        Array.isArray(msg.content) &&
                        msg.content.some((item) => item.type === 'stored-file' && item.mime?.startsWith('image/'))
                )
                if (imageInputMessages.length) {
                    inputMessages.push(...imageInputMessages)
                }
                if (input && typeof input === 'string') {
                    inputMessages.push({ role: 'user', content: question })
                }
            }
            const costMetadata = await this.calculateUsageCost(model, modelConfig?.modelName, response.usage_metadata)
            const output = {
                conditions,
                content: responseContent,
                timeMetadata: {
                    start: startTime,
                    end: endTime,
                    delta: timeDelta
                }
            }
            if (response.usage_metadata) {
                output.usageMetadata = { ...response.usage_metadata }
            }
            if (costMetadata && output.usageMetadata) {
                output.usageMetadata.input_cost = costMetadata.input_cost
                output.usageMetadata.output_cost = costMetadata.output_cost
                output.usageMetadata.total_cost = costMetadata.total_cost
                output.usageMetadata.base_input_cost = costMetadata.base_input_cost
                output.usageMetadata.base_output_cost = costMetadata.base_output_cost
            }
            if (response.response_metadata) {
                output.responseMetadata = response.response_metadata
            }
            const returnOutput = {
                id: nodeData.id,
                name: this.name,
                input: { messages: messagesWithFileReferences },
                output,
                state,
                chatHistory: [...inputMessages]
            }
            return returnOutput
        } catch (error) {
            if (options.analyticHandlers && llmIds) {
                await options.analyticHandlers.onLLMError(llmIds, error instanceof Error ? error.message : String(error))
            }
            if (error instanceof Error && error.message === 'Aborted') {
                throw error
            }
            throw new Error(`Error in Condition Agent node: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
    /**
     * Handles memory management based on the specified memory type
     */
    async handleMemory({
        messages,
        memoryType,
        pastChatHistory,
        runtimeChatHistory,
        llmNodeInstance,
        nodeData,
        input,
        abortController,
        options,
        modelConfig
    }) {
        const { updatedPastMessages } = await (0, utils_1.getPastChatHistoryImageMessages)(pastChatHistory, options)
        pastChatHistory = updatedPastMessages
        let pastMessages = [...pastChatHistory, ...runtimeChatHistory]
        if (!runtimeChatHistory.length) {
            /*
             * If this is the first node:
             * - Add images to messages if exist
             */
            if (options.uploads) {
                const imageContents = await (0, utils_1.getUniqueImageMessages)(options, messages, modelConfig)
                if (imageContents) {
                    pastMessages.push(imageContents.imageMessageWithBase64)
                }
            }
        }
        const { updatedMessages } = await (0, utils_1.processMessagesWithImages)(pastMessages, options)
        pastMessages = updatedMessages
        if (pastMessages.length > 0) {
            if (memoryType === 'windowSize') {
                // Window memory: Keep the last N messages
                const windowSize = nodeData.inputs?.conditionAgentMemoryWindowSize
                const windowedMessages = pastMessages.slice(-windowSize * 2)
                messages.push(...windowedMessages)
            } else if (memoryType === 'conversationSummary') {
                // Summary memory: Summarize all past messages
                const summary = await llmNodeInstance.invoke(
                    [
                        {
                            role: 'user',
                            content: prompt_1.DEFAULT_SUMMARIZER_TEMPLATE.replace(
                                '{conversation}',
                                pastMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
                            )
                        }
                    ],
                    { signal: abortController?.signal }
                )
                messages.push({ role: 'assistant', content: (0, utils_2.extractResponseContent)(summary) })
            } else if (memoryType === 'conversationSummaryBuffer') {
                // Summary buffer: Summarize messages that exceed token limit
                await this.handleSummaryBuffer(messages, pastMessages, llmNodeInstance, nodeData, abortController)
            } else {
                // Default: Use all messages
                messages.push(...pastMessages)
            }
        }
        messages.push({
            role: 'user',
            content: input
        })
    }
    /**
     * Handles conversation summary buffer memory type
     */
    async handleSummaryBuffer(messages, pastMessages, llmNodeInstance, nodeData, abortController) {
        const maxTokenLimit = nodeData.inputs?.conditionAgentMemoryMaxTokenLimit || 2000
        // Convert past messages to a format suitable for token counting
        const messagesString = pastMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
        const tokenCount = await llmNodeInstance.getNumTokens(messagesString)
        if (tokenCount > maxTokenLimit) {
            // Calculate how many messages to summarize (messages that exceed the token limit)
            let currBufferLength = tokenCount
            const messagesToSummarize = []
            const remainingMessages = [...pastMessages]
            // Remove messages from the beginning until we're under the token limit
            while (currBufferLength > maxTokenLimit && remainingMessages.length > 0) {
                const poppedMessage = remainingMessages.shift()
                if (poppedMessage) {
                    messagesToSummarize.push(poppedMessage)
                    // Recalculate token count for remaining messages
                    const remainingMessagesString = remainingMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
                    currBufferLength = await llmNodeInstance.getNumTokens(remainingMessagesString)
                }
            }
            // Summarize the messages that were removed
            const messagesToSummarizeString = messagesToSummarize.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
            const summary = await llmNodeInstance.invoke(
                [
                    {
                        role: 'user',
                        content: prompt_1.DEFAULT_SUMMARIZER_TEMPLATE.replace('{conversation}', messagesToSummarizeString)
                    }
                ],
                { signal: abortController?.signal }
            )
            // Add summary as a system message at the beginning, then add remaining messages
            let summaryRole = 'system'
            if (messages.some((msg) => typeof msg === 'object' && !Array.isArray(msg) && 'role' in msg && msg.role === 'system')) {
                summaryRole = 'user' // some model doesn't allow multiple system messages
            }
            messages.push({ role: summaryRole, content: `Previous conversation summary: ${(0, utils_2.extractResponseContent)(summary)}` })
            messages.push(...remainingMessages)
        } else {
            // If under token limit, use all messages
            messages.push(...pastMessages)
        }
    }
    /**
     * Calculates input/output and total cost from usage metadata using model pricing from models.json.
     */
    async calculateUsageCost(provider, modelName, usageMetadata) {
        if (!provider || !modelName) return undefined
        const inputTokens = usageMetadata?.input_tokens ?? 0
        const outputTokens = usageMetadata?.output_tokens ?? 0
        try {
            const modelConfig = await (0, modelLoader_1.getModelConfigByModelName)(modelLoader_1.MODEL_TYPE.CHAT, provider, modelName)
            if (!modelConfig) return undefined
            const baseInputCost = Number(modelConfig.input_cost) || 0
            const baseOutputCost = Number(modelConfig.output_cost) || 0
            const inputCost = inputTokens * baseInputCost
            const outputCost = outputTokens * baseOutputCost
            const totalCost = inputCost + outputCost
            if (inputCost === 0 && outputCost === 0) return undefined
            return {
                input_cost: inputCost,
                output_cost: outputCost,
                total_cost: totalCost,
                base_input_cost: baseInputCost,
                base_output_cost: baseOutputCost
            }
        } catch {
            return undefined
        }
    }
}
module.exports = { nodeClass: ConditionAgent_Agentflow }
//# sourceMappingURL=ConditionAgent.js.map
