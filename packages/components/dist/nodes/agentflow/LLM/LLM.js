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
const utils_1 = require('../utils')
const utils_2 = require('../../../src/utils')
const modelLoader_1 = require('../../../src/modelLoader')
const lodash_1 = require('lodash')
class LLM_Agentflow {
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
            },
            async listRuntimeStateKeys(_, options) {
                const previousNodes = options.previousNodes
                const startAgentflowNode = previousNodes.find((node) => node.name === 'startAgentflow')
                const state = startAgentflowNode?.inputs?.startState
                return state.map((item) => ({ label: item.key, name: item.key }))
            }
        }
        this.label = 'LLM'
        this.name = 'llmAgentflow'
        this.version = 1.1
        this.type = 'LLM'
        this.category = 'Agent Flows'
        this.description = 'Large language models to analyze user-provided inputs and generate responses'
        this.color = '#64B5F6'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Model',
                name: 'llmModel',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                loadConfig: true
            },
            {
                label: 'Messages',
                name: 'llmMessages',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Role',
                        name: 'role',
                        type: 'options',
                        options: [
                            {
                                label: 'System',
                                name: 'system'
                            },
                            {
                                label: 'Assistant',
                                name: 'assistant'
                            },
                            {
                                label: 'Developer',
                                name: 'developer'
                            },
                            {
                                label: 'User',
                                name: 'user'
                            }
                        ]
                    },
                    {
                        label: 'Content',
                        name: 'content',
                        type: 'string',
                        acceptVariable: true,
                        generateInstruction: true,
                        rows: 4
                    }
                ]
            },
            {
                label: 'Enable Memory',
                name: 'llmEnableMemory',
                type: 'boolean',
                description: 'Enable memory for the conversation thread',
                default: true,
                optional: true
            },
            {
                label: 'Memory Type',
                name: 'llmMemoryType',
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
                    llmEnableMemory: true
                }
            },
            {
                label: 'Window Size',
                name: 'llmMemoryWindowSize',
                type: 'number',
                default: '20',
                description: 'Uses a fixed window size to surface the last N messages',
                show: {
                    llmMemoryType: 'windowSize'
                }
            },
            {
                label: 'Max Token Limit',
                name: 'llmMemoryMaxTokenLimit',
                type: 'number',
                default: '2000',
                description: 'Summarize conversations once token limit is reached. Default to 2000',
                show: {
                    llmMemoryType: 'conversationSummaryBuffer'
                }
            },
            {
                label: 'Input Message',
                name: 'llmUserMessage',
                type: 'string',
                description: 'Add an input message as user message at the end of the conversation',
                rows: 4,
                optional: true,
                acceptVariable: true,
                show: {
                    llmEnableMemory: true
                }
            },
            {
                label: 'Return Response As',
                name: 'llmReturnResponseAs',
                type: 'options',
                options: [
                    {
                        label: 'User Message',
                        name: 'userMessage'
                    },
                    {
                        label: 'Assistant Message',
                        name: 'assistantMessage'
                    }
                ],
                default: 'userMessage'
            },
            {
                label: 'JSON Structured Output',
                name: 'llmStructuredOutput',
                description: 'Instruct the LLM to give output in a JSON structured schema',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Key',
                        name: 'key',
                        type: 'string'
                    },
                    {
                        label: 'Type',
                        name: 'type',
                        type: 'options',
                        options: [
                            {
                                label: 'String',
                                name: 'string'
                            },
                            {
                                label: 'String Array',
                                name: 'stringArray'
                            },
                            {
                                label: 'Number',
                                name: 'number'
                            },
                            {
                                label: 'Boolean',
                                name: 'boolean'
                            },
                            {
                                label: 'Enum',
                                name: 'enum'
                            },
                            {
                                label: 'JSON Array',
                                name: 'jsonArray'
                            }
                        ]
                    },
                    {
                        label: 'Enum Values',
                        name: 'enumValues',
                        type: 'string',
                        placeholder: 'value1, value2, value3',
                        description: 'Enum values. Separated by comma',
                        optional: true,
                        show: {
                            'llmStructuredOutput[$index].type': 'enum'
                        }
                    },
                    {
                        label: 'JSON Schema',
                        name: 'jsonSchema',
                        type: 'code',
                        placeholder: `{
    "answer": {
        "type": "string",
        "description": "Value of the answer"
    },
    "reason": {
        "type": "string",
        "description": "Reason for the answer"
    },
    "optional": {
        "type": "boolean"
    },
    "count": {
        "type": "number"
    },
    "children": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "string",
                    "description": "Value of the children's answer"
                }
            }
        }
    }
}`,
                        description: 'JSON schema for the structured output',
                        optional: true,
                        hideCodeExecute: true,
                        show: {
                            'llmStructuredOutput[$index].type': 'jsonArray'
                        }
                    },
                    {
                        label: 'Description',
                        name: 'description',
                        type: 'string',
                        placeholder: 'Description of the key'
                    }
                ]
            },
            {
                label: 'Update Flow State',
                name: 'llmUpdateState',
                description: 'Update runtime state during the execution of the workflow',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Key',
                        name: 'key',
                        type: 'asyncOptions',
                        loadMethod: 'listRuntimeStateKeys'
                    },
                    {
                        label: 'Value',
                        name: 'value',
                        type: 'string',
                        acceptVariable: true,
                        acceptNodeOutputAsVariable: true
                    }
                ]
            }
        ]
    }
    async run(nodeData, input, options) {
        let llmIds
        let analyticHandlers = options.analyticHandlers
        try {
            const abortController = options.abortController
            // Extract input parameters
            const model = nodeData.inputs?.llmModel
            const modelConfig = nodeData.inputs?.llmModelConfig
            if (!model) {
                throw new Error('Model is required')
            }
            const modelName = modelConfig?.model ?? modelConfig?.modelName
            // Extract memory and configuration options
            const enableMemory = nodeData.inputs?.llmEnableMemory
            const memoryType = nodeData.inputs?.llmMemoryType
            const userMessage = nodeData.inputs?.llmUserMessage
            const _llmUpdateState = nodeData.inputs?.llmUpdateState
            const _llmStructuredOutput = nodeData.inputs?.llmStructuredOutput
            const llmMessages = nodeData.inputs?.llmMessages ?? []
            // Extract runtime state and history
            const state = options.agentflowRuntime?.state
            const pastChatHistory = options.pastChatHistory ?? []
            const runtimeChatHistory = options.agentflowRuntime?.chatHistory ?? []
            const prependedChatHistory = options.prependedChatHistory
            const chatId = options.chatId
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
            // Prepare messages array
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
            for (const msg of llmMessages) {
                const role = msg.role
                const content = msg.content
                if (role && content) {
                    if (role === 'system') {
                        messages.unshift({ role, content })
                    } else {
                        messages.push({ role, content })
                    }
                }
            }
            // Handle memory management if enabled
            if (enableMemory) {
                await this.handleMemory({
                    messages,
                    memoryType,
                    pastChatHistory,
                    runtimeChatHistory,
                    llmNodeInstance,
                    nodeData,
                    userMessage,
                    input,
                    abortController,
                    options,
                    modelConfig
                })
            } else if (!runtimeChatHistory.length) {
                /*
                 * If this is the first node:
                 * - Add images to messages if exist
                 * - Add user message if it does not exist in the llmMessages array
                 */
                if (options.uploads) {
                    const imageContents = await (0, utils_1.getUniqueImageMessages)(options, messages, modelConfig)
                    if (imageContents) {
                        messages.push(imageContents.imageMessageWithBase64)
                    }
                }
                if (input && typeof input === 'string' && !llmMessages.some((msg) => msg.role === 'user')) {
                    messages.push({
                        role: 'user',
                        content: input
                    })
                }
            }
            delete nodeData.inputs?.llmMessages
            /**
             * Add image artifacts from previous assistant responses as user messages.
             * Only the inserted temporary messages contain base64 — other messages are untouched.
             */
            await (0, utils_1.addImageArtifactsToMessages)(messages, options)
            // Configure structured output if specified
            const isStructuredOutput = _llmStructuredOutput && Array.isArray(_llmStructuredOutput) && _llmStructuredOutput.length > 0
            if (isStructuredOutput) {
                llmNodeInstance = (0, utils_2.configureStructuredOutput)(llmNodeInstance, _llmStructuredOutput)
            }
            // Initialize response and determine if streaming is possible
            let response = new messages_1.AIMessageChunk('')
            const isLastNode = options.isLastNode
            const streamingConfig = modelConfig?.streaming
            const useDefault = streamingConfig == null || streamingConfig === ''
            const effectiveStreaming = useDefault
                ? newLLMNodeInstance.inputs?.find((i) => i.name === 'streaming')?.default ?? true
                : streamingConfig
            const isStreamable = isLastNode && options.sseStreamer !== undefined && effectiveStreaming !== false && !isStructuredOutput
            // Start analytics
            if (analyticHandlers && options.parentTraceIds) {
                const llmLabel = options?.componentNodes?.[model]?.label || model
                llmIds = await analyticHandlers.onLLMStart(llmLabel, messages, options.parentTraceIds)
            }
            // Track execution time
            const startTime = Date.now()
            const sseStreamer = options.sseStreamer
            /*
             * Invoke LLM
             */
            if (isStreamable) {
                response = await this.handleStreamingResponse(
                    sseStreamer,
                    llmNodeInstance,
                    messages,
                    chatId,
                    abortController,
                    isStructuredOutput,
                    isLastNode
                )
            } else {
                response = await llmNodeInstance.invoke(messages, { signal: abortController?.signal })
                // Stream whole response back to UI if this is the last node
                if (isLastNode && options.sseStreamer) {
                    const sseStreamer = options.sseStreamer
                    const finalResponse = (0, utils_2.extractResponseContent)(response)
                    sseStreamer.streamTokenEvent(chatId, finalResponse)
                }
            }
            // Calculate execution time
            const endTime = Date.now()
            const timeDelta = endTime - startTime
            // Extract artifacts and file annotations from response metadata
            let artifacts = []
            let fileAnnotations = []
            if (response.response_metadata) {
                const {
                    artifacts: extractedArtifacts,
                    fileAnnotations: extractedFileAnnotations,
                    savedInlineImages
                } = await (0, utils_1.extractArtifactsFromResponse)(response.response_metadata, newNodeData, options)
                if (extractedArtifacts.length > 0) {
                    artifacts = extractedArtifacts
                    // Stream artifacts if this is the last node
                    if (isLastNode && sseStreamer) {
                        sseStreamer.streamArtifactsEvent(chatId, artifacts)
                    }
                }
                if (extractedFileAnnotations.length > 0) {
                    fileAnnotations = extractedFileAnnotations
                    // Stream file annotations if this is the last node
                    if (isLastNode && sseStreamer) {
                        sseStreamer.streamFileAnnotationsEvent(chatId, fileAnnotations)
                    }
                }
                // Replace inlineData base64 with file references in the response
                if (savedInlineImages && savedInlineImages.length > 0) {
                    ;(0, utils_1.replaceInlineDataWithFileReferences)(response, savedInlineImages)
                }
            }
            // Update flow state if needed
            let newState = { ...state }
            if (_llmUpdateState && Array.isArray(_llmUpdateState) && _llmUpdateState.length > 0) {
                newState = (0, utils_1.updateFlowState)(state, _llmUpdateState)
            }
            // Clean up empty inputs
            for (const key in nodeData.inputs) {
                if (nodeData.inputs[key] === '') {
                    delete nodeData.inputs[key]
                }
            }
            // Extract reason content from response (reasoning_content/reasoning_duration or contentBlocks)
            let reasonContent = response.additional_kwargs?.reasoning_content || ''
            let thinkingDuration =
                typeof response.additional_kwargs?.reasoning_duration === 'number'
                    ? response.additional_kwargs.reasoning_duration
                    : undefined
            if (!reasonContent && response.contentBlocks?.length && isLastNode && sseStreamer && !isStructuredOutput) {
                for (const block of response.contentBlocks) {
                    if (block.type === 'reasoning' && block.reasoning) {
                        reasonContent += block.reasoning
                    }
                    if (block.type === 'thinking' && block.thinking) {
                        reasonContent += block.thinking
                    }
                }
                if (reasonContent) {
                    sseStreamer.streamThinkingEvent(chatId, reasonContent)
                    const reasoningTokens = response.usage_metadata?.output_token_details?.reasoning || 0
                    thinkingDuration = reasoningTokens > 0 ? Math.round(reasoningTokens / 50) : 2
                    sseStreamer.streamThinkingEvent(chatId, '', thinkingDuration)
                }
            }
            const reasonContentObj =
                reasonContent !== undefined && reasonContent !== '' ? { thinking: reasonContent, thinkingDuration } : undefined
            // Prepare final response and output object
            const finalResponse = (0, utils_2.extractResponseContent)(response)
            const costMetadata = await this.calculateUsageCost(model, modelConfig?.modelName, response.usage_metadata)
            const output = this.prepareOutputObject(
                response,
                finalResponse,
                startTime,
                endTime,
                timeDelta,
                isStructuredOutput,
                artifacts,
                fileAnnotations,
                reasonContentObj,
                costMetadata
            )
            // End analytics tracking
            if (analyticHandlers && llmIds) {
                await analyticHandlers.onLLMEnd(llmIds, output, { model: modelName, provider: model })
            }
            // Send additional streaming events if needed
            if (isStreamable) {
                this.sendStreamingEvents(options, chatId, response)
            }
            // Stream file annotations if any were extracted
            if (fileAnnotations.length > 0 && isLastNode && sseStreamer) {
                sseStreamer.streamFileAnnotationsEvent(chatId, fileAnnotations)
            }
            // Process template variables in state
            newState = (0, utils_2.processTemplateVariables)(newState, finalResponse)
            /**
             * Remove temporary artifact image messages (only needed for model invoke).
             * Then revert all remaining tagged base64 image_url items back to stored-file format.
             * This is to avoid storing the actual base64 data into database
             */
            const messagesToStore = messages.filter((msg) => !msg._isTemporaryImageMessage)
            const messagesWithFileReferences = (0, utils_1.revertBase64ImagesToFileRefs)(messagesToStore)
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
                    if (!enableMemory) {
                        if (!llmMessages.some((msg) => msg.role === 'user')) {
                            inputMessages.push({ role: 'user', content: input })
                        } else {
                            llmMessages.map((msg) => {
                                if (msg.role === 'user') {
                                    inputMessages.push({ role: 'user', content: msg.content })
                                }
                            })
                        }
                    } else {
                        inputMessages.push({ role: 'user', content: input })
                    }
                }
            }
            const returnResponseAs = nodeData.inputs?.llmReturnResponseAs
            let returnRole = 'user'
            if (returnResponseAs === 'assistantMessage') {
                returnRole = 'assistant'
            }
            // Prepare and return the final output
            return {
                id: nodeData.id,
                name: this.name,
                input: {
                    messages: messagesWithFileReferences,
                    ...nodeData.inputs
                },
                output,
                state: newState,
                chatHistory: [
                    ...inputMessages,
                    // LLM response
                    {
                        role: returnRole,
                        content: finalResponse,
                        name: nodeData?.label ? nodeData?.label.toLowerCase().replace(/\s/g, '_').trim() : nodeData?.id,
                        ...(((artifacts && artifacts.length > 0) || (fileAnnotations && fileAnnotations.length > 0)) && {
                            additional_kwargs: {
                                ...(artifacts && artifacts.length > 0 && { artifacts }),
                                ...(fileAnnotations && fileAnnotations.length > 0 && { fileAnnotations })
                            }
                        })
                    }
                ]
            }
        } catch (error) {
            if (options.analyticHandlers && llmIds) {
                await options.analyticHandlers.onLLMError(llmIds, error instanceof Error ? error.message : String(error))
            }
            if (error instanceof Error && error.message === 'Aborted') {
                throw error
            }
            throw new Error(`Error in LLM node: ${error instanceof Error ? error.message : String(error)}`)
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
        userMessage,
        input,
        abortController,
        options,
        modelConfig
    }) {
        const { updatedPastMessages } = await (0, utils_1.getPastChatHistoryImageMessages)(pastChatHistory, options)
        pastChatHistory = updatedPastMessages
        let pastMessages = [...pastChatHistory, ...runtimeChatHistory]
        if (!runtimeChatHistory.length && input && typeof input === 'string') {
            /*
             * If this is the first node:
             * - Add images to messages if exist
             * - Add user message
             */
            if (options.uploads) {
                const imageContents = await (0, utils_1.getUniqueImageMessages)(options, messages, modelConfig)
                if (imageContents) {
                    pastMessages.push(imageContents.imageMessageWithBase64)
                }
            }
            pastMessages.push({
                role: 'user',
                content: input
            })
        }
        const { updatedMessages } = await (0, utils_1.processMessagesWithImages)(pastMessages, options)
        pastMessages = updatedMessages
        if (pastMessages.length > 0) {
            if (memoryType === 'windowSize') {
                // Window memory: Keep the last N messages
                const windowSize = nodeData.inputs?.llmMemoryWindowSize
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
        // Add user message
        if (userMessage) {
            messages.push({
                role: 'user',
                content: userMessage
            })
        }
    }
    /**
     * Handles conversation summary buffer memory type
     */
    async handleSummaryBuffer(messages, pastMessages, llmNodeInstance, nodeData, abortController) {
        const maxTokenLimit = nodeData.inputs?.llmMemoryMaxTokenLimit || 2000
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
     * Handles streaming response from the LLM
     */
    async handleStreamingResponse(
        sseStreamer,
        llmNodeInstance,
        messages,
        chatId,
        abortController,
        isStructuredOutput = false,
        isLastNode = false
    ) {
        let response = new messages_1.AIMessageChunk('')
        let reasonContent = ''
        let thinkingDuration
        let thinkingStartTime = null
        let wasThinking = false
        let sentLastThinkingEvent = false
        try {
            for await (const chunk of await llmNodeInstance.stream(messages, { signal: abortController?.signal })) {
                if (sseStreamer && !isStructuredOutput) {
                    let content = ''
                    if (chunk.contentBlocks?.length) {
                        for (const block of chunk.contentBlocks) {
                            if (isLastNode) {
                                // As soon as we see the first non-reasoning block, send last thinking event with duration (only when isLastNode)
                                if (block.type !== 'reasoning' && wasThinking && !sentLastThinkingEvent && thinkingStartTime != null) {
                                    thinkingDuration = Math.round((Date.now() - thinkingStartTime) / 1000)
                                    sseStreamer.streamThinkingEvent(chatId, '', thinkingDuration)
                                    sentLastThinkingEvent = true
                                }
                                if (block.type === 'reasoning' && block.reasoning) {
                                    if (!thinkingStartTime) {
                                        thinkingStartTime = Date.now()
                                    }
                                    wasThinking = true
                                    const reasoningContent = block.reasoning
                                    sseStreamer.streamThinkingEvent(chatId, reasoningContent)
                                    reasonContent += reasoningContent
                                }
                            }
                        }
                    }
                    if (typeof chunk === 'string') {
                        content = chunk
                    } else if (Array.isArray(chunk.content) && chunk.content.length > 0) {
                        const contents = chunk.content
                        content = contents.map((item) => item.text).join('')
                    } else if (chunk.content) {
                        content = chunk.content.toString()
                    }
                    sseStreamer.streamTokenEvent(chatId, content)
                }
                const messageChunk = typeof chunk === 'string' ? new messages_1.AIMessageChunk(chunk) : chunk
                response = response.concat(messageChunk)
            }
        } catch (error) {
            console.error('Error during streaming:', error)
            throw error
        }
        // Only convert to string if all content items are text (no inlineData or other special types)
        if (Array.isArray(response.content) && response.content.length > 0) {
            const hasNonTextContent = response.content.some(
                (item) => item.type === 'inlineData' || item.type === 'executableCode' || item.type === 'codeExecutionResult'
            )
            if (!hasNonTextContent) {
                const responseContents = response.content
                response.content = responseContents.map((item) => item.text).join('')
            }
        }
        if (reasonContent.length > 0) {
            response.additional_kwargs = {
                ...response.additional_kwargs,
                reasoning_content: reasonContent,
                reasoning_duration: thinkingDuration
            }
        }
        return response
    }
    /**
     * Calculates input/output and total cost from usage metadata using model pricing from models.json.
     * Also returns the model's base (per-token) input and output costs.
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
    /**
     * Prepares the output object with response and metadata
     */
    prepareOutputObject(
        response,
        finalResponse,
        startTime,
        endTime,
        timeDelta,
        isStructuredOutput,
        artifacts = [],
        fileAnnotations = [],
        reasonContent,
        costMetadata
    ) {
        const output = {
            content: finalResponse,
            timeMetadata: {
                start: startTime,
                end: endTime,
                delta: timeDelta
            }
        }
        if (response.tool_calls) {
            output.calledTools = response.tool_calls
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
        if (isStructuredOutput && typeof response === 'object') {
            const structuredOutput = response
            for (const key in structuredOutput) {
                if (structuredOutput[key] !== undefined && structuredOutput[key] !== null) {
                    output[key] = structuredOutput[key]
                }
            }
        }
        if (artifacts && artifacts.length > 0) {
            output.artifacts = (0, lodash_1.flatten)(artifacts)
        }
        if (fileAnnotations && fileAnnotations.length > 0) {
            output.fileAnnotations = fileAnnotations
        }
        if (reasonContent) {
            output.reasonContent = reasonContent
        }
        return output
    }
    /**
     * Sends additional streaming events for tool calls and metadata
     */
    sendStreamingEvents(options, chatId, response) {
        const sseStreamer = options.sseStreamer
        if (response.tool_calls) {
            const formattedToolCalls = response.tool_calls.map((toolCall) => ({
                tool: toolCall.name || 'tool',
                toolInput: toolCall.args,
                toolOutput: ''
            }))
            sseStreamer.streamCalledToolsEvent(chatId, (0, lodash_1.flatten)(formattedToolCalls))
        }
        if (response.usage_metadata) {
            sseStreamer.streamUsageMetadataEvent(chatId, response.usage_metadata)
        }
        sseStreamer.streamEndEvent(chatId)
    }
}
module.exports = { nodeClass: LLM_Agentflow }
//# sourceMappingURL=LLM.js.map
