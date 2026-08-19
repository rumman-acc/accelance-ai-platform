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
const agents_1 = require('../../../src/agents')
const lodash_1 = require('lodash')
const utils_1 = require('../../../src/utils')
const error_1 = require('../../../src/error')
const crypto_1 = require('crypto')
const utils_2 = require('../utils')
const utils_3 = require('../../../src/utils')
const validator_1 = require('../../../src/validator')
const modelLoader_1 = require('../../../src/modelLoader')
/**
 * Sanitizes a string to be used as a tool name.
 * Restricts to ASCII characters [a-z0-9_-] for LLM API compatibility (OpenAI, Anthropic, Gemini).
 * Non-ASCII titles (Korean, Chinese, Japanese, etc.) will use auto-generated fallback names.
 * This prevents 'Invalid tools[0].function.name: empty string' errors.
 */
const sanitizeToolName = (name) => {
    const sanitized = name
        .toLowerCase()
        .replace(/ /g, '_')
        .replace(/[^a-z0-9_-]/g, '') // ASCII only for LLM API compatibility
    // If the result is empty (e.g., non-ASCII only input), generate a unique fallback name
    if (!sanitized) {
        return `tool_${Date.now()}_${(0, crypto_1.randomBytes)(4).toString('hex').slice(0, 5)}`
    }
    // Enforce 64 character limit common for tool names
    return sanitized.slice(0, 64)
}
class Agent_Agentflow {
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
            async listEmbeddings(_, options) {
                const componentNodes = options.componentNodes
                const returnOptions = []
                for (const nodeName in componentNodes) {
                    const componentNode = componentNodes[nodeName]
                    if (componentNode.category === 'Embeddings') {
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
            async listTools(_, options) {
                const componentNodes = options.componentNodes
                const removeTools = ['chainTool', 'retrieverTool', 'webBrowser']
                const returnOptions = []
                for (const nodeName in componentNodes) {
                    const componentNode = componentNodes[nodeName]
                    if (componentNode.category === 'Tools' || componentNode.category === 'Tools (MCP)') {
                        if (componentNode.tags?.includes('LlamaIndex')) {
                            continue
                        }
                        if (removeTools.includes(nodeName)) {
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
            },
            async listStores(_, options) {
                const returnData = []
                const appDataSource = options.appDataSource
                const databaseEntities = options.databaseEntities
                if (appDataSource === undefined || !appDataSource) {
                    return returnData
                }
                const searchOptions = options.searchOptions || {}
                const stores = await appDataSource.getRepository(databaseEntities['DocumentStore']).findBy(searchOptions)
                for (const store of stores) {
                    if (store.status === 'UPSERTED') {
                        const obj = {
                            name: `${store.id}:${store.name}`,
                            label: store.name,
                            description: store.description
                        }
                        returnData.push(obj)
                    }
                }
                return returnData
            },
            async listVectorStores(_, options) {
                const componentNodes = options.componentNodes
                const returnOptions = []
                for (const nodeName in componentNodes) {
                    const componentNode = componentNodes[nodeName]
                    if (componentNode.category === 'Vector Stores') {
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
        this.label = 'Agent'
        this.name = 'agentAgentflow'
        this.version = 3.2
        this.type = 'Agent'
        this.category = 'Agent Flows'
        this.description = 'Dynamically choose and utilize tools during runtime, enabling multi-step reasoning'
        this.color = '#4DD0E1'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Model',
                name: 'agentModel',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                loadConfig: true
            },
            {
                label: 'Messages',
                name: 'agentMessages',
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
                label: 'OpenAI Built-in Tools',
                name: 'agentToolsBuiltInOpenAI',
                type: 'multiOptions',
                optional: true,
                options: [
                    {
                        label: 'Web Search',
                        name: 'web_search_preview',
                        description: 'Search the web for the latest information'
                    },
                    {
                        label: 'Code Interpreter',
                        name: 'code_interpreter',
                        description: 'Write and run Python code in a sandboxed environment'
                    },
                    {
                        label: 'Image Generation',
                        name: 'image_generation',
                        description: 'Generate images based on a text prompt'
                    }
                ],
                show: {
                    agentModel: 'chatOpenAI'
                }
            },
            {
                label: 'Gemini Built-in Tools',
                name: 'agentToolsBuiltInGemini',
                type: 'multiOptions',
                optional: true,
                options: [
                    {
                        label: 'URL Context',
                        name: 'urlContext',
                        description: 'Extract content from given URLs'
                    },
                    {
                        label: 'Google Search',
                        name: 'googleSearch',
                        description: 'Search real-time web content'
                    },
                    {
                        label: 'Code Execution',
                        name: 'codeExecution',
                        description: 'Write and run Python code in a sandboxed environment'
                    }
                ],
                show: {
                    agentModel: 'chatGoogleGenerativeAI'
                }
            },
            {
                label: 'Anthropic Built-in Tools',
                name: 'agentToolsBuiltInAnthropic',
                type: 'multiOptions',
                optional: true,
                options: [
                    {
                        label: 'Web Search',
                        name: 'web_search_20250305',
                        description: 'Search the web for the latest information'
                    },
                    {
                        label: 'Web Fetch',
                        name: 'web_fetch_20250910',
                        description: 'Retrieve full content from specified web pages'
                    }
                    /*
                    * Not supported yet as we need to get bash_code_execution_tool_result from content:
                    https://docs.claude.com/en/docs/agents-and-tools/tool-use/code-execution-tool#retrieve-generated-files
                    {
                        label: 'Code Interpreter',
                        name: 'code_execution_20250825',
                        description: 'Write and run Python code in a sandboxed environment'
                    }*/
                ],
                show: {
                    agentModel: 'chatAnthropic'
                }
            },
            {
                label: 'Tools',
                name: 'agentTools',
                type: 'array',
                optional: true,
                array: [
                    {
                        label: 'Tool',
                        name: 'agentSelectedTool',
                        type: 'asyncOptions',
                        loadMethod: 'listTools',
                        loadConfig: true
                    },
                    {
                        label: 'Require Human Input',
                        name: 'agentSelectedToolRequiresHumanInput',
                        type: 'boolean',
                        optional: true
                    }
                ]
            },
            {
                label: 'Knowledge (Document Stores)',
                name: 'agentKnowledgeDocumentStores',
                type: 'array',
                description: 'Give your agent context about different document sources. Document stores must be upserted in advance.',
                client: ['agentflowv2'],
                array: [
                    {
                        label: 'Document Store',
                        name: 'documentStore',
                        type: 'asyncOptions',
                        loadMethod: 'listStores'
                    },
                    {
                        label: 'Describe Knowledge',
                        name: 'docStoreDescription',
                        type: 'string',
                        generateDocStoreDescription: true,
                        placeholder:
                            'Describe what the knowledge base is about, this is useful for the AI to know when and how to search for correct information',
                        rows: 4
                    },
                    {
                        label: 'Return Source Documents',
                        name: 'returnSourceDocuments',
                        type: 'boolean',
                        optional: true
                    }
                ],
                optional: true
            },
            {
                label: 'Knowledge (Vector Embeddings)',
                name: 'agentKnowledgeVSEmbeddings',
                type: 'array',
                description: 'Give your agent context about different document sources from existing vector stores and embeddings',
                client: ['agentflowv2'],
                array: [
                    {
                        label: 'Vector Store',
                        name: 'vectorStore',
                        type: 'asyncOptions',
                        loadMethod: 'listVectorStores',
                        loadConfig: true
                    },
                    {
                        label: 'Embedding Model',
                        name: 'embeddingModel',
                        type: 'asyncOptions',
                        loadMethod: 'listEmbeddings',
                        loadConfig: true
                    },
                    {
                        label: 'Knowledge Name',
                        name: 'knowledgeName',
                        type: 'string',
                        placeholder:
                            'A short name for the knowledge base, this is useful for the AI to know when and how to search for correct information'
                    },
                    {
                        label: 'Describe Knowledge',
                        name: 'knowledgeDescription',
                        type: 'string',
                        placeholder:
                            'Describe what the knowledge base is about, this is useful for the AI to know when and how to search for correct information',
                        rows: 4
                    },
                    {
                        label: 'Return Source Documents',
                        name: 'returnSourceDocuments',
                        type: 'boolean',
                        optional: true
                    }
                ],
                optional: true
            },
            {
                label: 'Enable Memory',
                name: 'agentEnableMemory',
                type: 'boolean',
                description: 'Enable memory for the conversation thread',
                default: true,
                optional: true
            },
            {
                label: 'Memory Type',
                name: 'agentMemoryType',
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
                    agentEnableMemory: true
                }
            },
            {
                label: 'Window Size',
                name: 'agentMemoryWindowSize',
                type: 'number',
                default: '20',
                description: 'Uses a fixed window size to surface the last N messages',
                show: {
                    agentMemoryType: 'windowSize'
                }
            },
            {
                label: 'Max Token Limit',
                name: 'agentMemoryMaxTokenLimit',
                type: 'number',
                default: '2000',
                description: 'Summarize conversations once token limit is reached. Default to 2000',
                show: {
                    agentMemoryType: 'conversationSummaryBuffer'
                }
            },
            {
                label: 'Input Message',
                name: 'agentUserMessage',
                type: 'string',
                description: 'Add an input message as user message at the end of the conversation',
                rows: 4,
                optional: true,
                acceptVariable: true,
                show: {
                    agentEnableMemory: true
                }
            },
            {
                label: 'Return Response As',
                name: 'agentReturnResponseAs',
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
                name: 'agentStructuredOutput',
                description: 'Instruct the Agent to give output in a JSON structured schema',
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
                            'agentStructuredOutput[$index].type': 'enum'
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
                            'agentStructuredOutput[$index].type': 'jsonArray'
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
                name: 'agentUpdateState',
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
            const model = nodeData.inputs?.agentModel
            const modelConfig = nodeData.inputs?.agentModelConfig
            if (!model) {
                throw new Error('Model is required')
            }
            const modelName = modelConfig?.model ?? modelConfig?.modelName
            // Extract tools
            const tools = nodeData.inputs?.agentTools
            const toolsInstance = []
            for (const tool of tools) {
                const toolConfig = tool.agentSelectedToolConfig
                const nodeInstanceFilePath = options.componentNodes[tool.agentSelectedTool].filePath
                const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
                const newToolNodeInstance = new nodeModule.nodeClass()
                const newNodeData = {
                    ...nodeData,
                    credential: toolConfig['FLOWISE_CREDENTIAL_ID'],
                    inputs: {
                        ...nodeData.inputs,
                        ...toolConfig
                    }
                }
                const toolInstance = await newToolNodeInstance.init(newNodeData, '', options)
                // toolInstance might returns a list of tools like MCP tools
                if (Array.isArray(toolInstance)) {
                    for (const subTool of toolInstance) {
                        const subToolInstance = subTool
                        subToolInstance.agentSelectedTool = tool.agentSelectedTool
                        if (tool.agentSelectedToolRequiresHumanInput) {
                            subToolInstance.requiresHumanInput = true
                        }
                        toolsInstance.push(subToolInstance)
                    }
                } else {
                    if (tool.agentSelectedToolRequiresHumanInput) {
                        toolInstance.requiresHumanInput = true
                    }
                    toolsInstance.push(toolInstance)
                }
            }
            const availableTools = toolsInstance.map((tool, index) => {
                const originalTool = tools[index]
                let agentSelectedTool = tool?.agentSelectedTool
                if (!agentSelectedTool) {
                    agentSelectedTool = originalTool?.agentSelectedTool
                }
                const componentNode = options.componentNodes[agentSelectedTool]
                const jsonSchema = (0, utils_1.toolSchemaToJsonSchema)(tool.schema)
                return {
                    name: tool.name,
                    description: tool.description,
                    schema: jsonSchema,
                    toolNode: {
                        label: componentNode?.label || tool.name,
                        name: componentNode?.name || tool.name
                    }
                }
            })
            // Extract knowledge
            const knowledgeBases = nodeData.inputs?.agentKnowledgeDocumentStores
            if (knowledgeBases && knowledgeBases.length > 0) {
                for (const knowledgeBase of knowledgeBases) {
                    const nodeInstanceFilePath = options.componentNodes['retrieverTool'].filePath
                    const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
                    const newRetrieverToolNodeInstance = new nodeModule.nodeClass()
                    const [storeId, storeName] = knowledgeBase.documentStore.split(':')
                    const docStoreVectorInstanceFilePath = options.componentNodes['documentStoreVS'].filePath
                    const docStoreVectorModule = await Promise.resolve(`${docStoreVectorInstanceFilePath}`).then((s) =>
                        __importStar(require(s))
                    )
                    const newDocStoreVectorInstance = new docStoreVectorModule.nodeClass()
                    const docStoreVectorInstance = await newDocStoreVectorInstance.init(
                        {
                            ...nodeData,
                            inputs: {
                                ...nodeData.inputs,
                                selectedStore: storeId
                            },
                            outputs: {
                                output: 'retriever'
                            }
                        },
                        '',
                        options
                    )
                    const newRetrieverToolNodeData = {
                        ...nodeData,
                        inputs: {
                            ...nodeData.inputs,
                            name: sanitizeToolName(storeName),
                            description: knowledgeBase.docStoreDescription,
                            retriever: docStoreVectorInstance,
                            returnSourceDocuments: knowledgeBase.returnSourceDocuments
                        }
                    }
                    const retrieverToolInstance = await newRetrieverToolNodeInstance.init(newRetrieverToolNodeData, '', options)
                    toolsInstance.push(retrieverToolInstance)
                    const jsonSchema = (0, utils_1.toolSchemaToJsonSchema)(retrieverToolInstance.schema)
                    const componentNode = options.componentNodes['retrieverTool']
                    availableTools.push({
                        name: sanitizeToolName(storeName),
                        description: knowledgeBase.docStoreDescription,
                        schema: jsonSchema,
                        toolNode: {
                            label: componentNode?.label || retrieverToolInstance.name,
                            name: componentNode?.name || retrieverToolInstance.name
                        }
                    })
                }
            }
            const knowledgeBasesForVSEmbeddings = nodeData.inputs?.agentKnowledgeVSEmbeddings
            if (knowledgeBasesForVSEmbeddings && knowledgeBasesForVSEmbeddings.length > 0) {
                for (const knowledgeBase of knowledgeBasesForVSEmbeddings) {
                    const nodeInstanceFilePath = options.componentNodes['retrieverTool'].filePath
                    const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
                    const newRetrieverToolNodeInstance = new nodeModule.nodeClass()
                    const selectedEmbeddingModel = knowledgeBase.embeddingModel
                    const selectedEmbeddingModelConfig = knowledgeBase.embeddingModelConfig
                    const embeddingInstanceFilePath = options.componentNodes[selectedEmbeddingModel].filePath
                    const embeddingModule = await Promise.resolve(`${embeddingInstanceFilePath}`).then((s) => __importStar(require(s)))
                    const newEmbeddingInstance = new embeddingModule.nodeClass()
                    const newEmbeddingNodeData = {
                        ...nodeData,
                        credential: selectedEmbeddingModelConfig['FLOWISE_CREDENTIAL_ID'],
                        inputs: {
                            ...nodeData.inputs,
                            ...selectedEmbeddingModelConfig
                        }
                    }
                    const embeddingInstance = await newEmbeddingInstance.init(newEmbeddingNodeData, '', options)
                    const selectedVectorStore = knowledgeBase.vectorStore
                    const selectedVectorStoreConfig = knowledgeBase.vectorStoreConfig
                    const vectorStoreInstanceFilePath = options.componentNodes[selectedVectorStore].filePath
                    const vectorStoreModule = await Promise.resolve(`${vectorStoreInstanceFilePath}`).then((s) => __importStar(require(s)))
                    const newVectorStoreInstance = new vectorStoreModule.nodeClass()
                    const newVSNodeData = {
                        ...nodeData,
                        credential: selectedVectorStoreConfig['FLOWISE_CREDENTIAL_ID'],
                        inputs: {
                            ...nodeData.inputs,
                            ...selectedVectorStoreConfig,
                            embeddings: embeddingInstance
                        },
                        outputs: {
                            output: 'retriever'
                        }
                    }
                    const vectorStoreInstance = await newVectorStoreInstance.init(newVSNodeData, '', options)
                    const knowledgeName = knowledgeBase.knowledgeName || ''
                    const newRetrieverToolNodeData = {
                        ...nodeData,
                        inputs: {
                            ...nodeData.inputs,
                            name: sanitizeToolName(knowledgeName),
                            description: knowledgeBase.knowledgeDescription,
                            retriever: vectorStoreInstance,
                            returnSourceDocuments: knowledgeBase.returnSourceDocuments
                        }
                    }
                    const retrieverToolInstance = await newRetrieverToolNodeInstance.init(newRetrieverToolNodeData, '', options)
                    toolsInstance.push(retrieverToolInstance)
                    const jsonSchema = (0, utils_1.toolSchemaToJsonSchema)(retrieverToolInstance.schema)
                    const componentNode = options.componentNodes['retrieverTool']
                    availableTools.push({
                        name: sanitizeToolName(knowledgeName),
                        description: knowledgeBase.knowledgeDescription,
                        schema: jsonSchema,
                        toolNode: {
                            label: componentNode?.label || retrieverToolInstance.name,
                            name: componentNode?.name || retrieverToolInstance.name
                        }
                    })
                }
            }
            // Extract memory and configuration options
            const enableMemory = nodeData.inputs?.agentEnableMemory
            const memoryType = nodeData.inputs?.agentMemoryType
            const userMessage = nodeData.inputs?.agentUserMessage
            const _agentUpdateState = nodeData.inputs?.agentUpdateState
            const _agentStructuredOutput = nodeData.inputs?.agentStructuredOutput
            const agentMessages = nodeData.inputs?.agentMessages ?? []
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
            const llmWithoutToolsBind = await newLLMNodeInstance.init(newNodeData, '', options)
            let llmNodeInstance = llmWithoutToolsBind // save the original LLM instance for later use in withStructuredOutput, getNumTokens
            const isStructuredOutput = _agentStructuredOutput && Array.isArray(_agentStructuredOutput) && _agentStructuredOutput.length > 0
            const agentToolsBuiltInOpenAI = (0, utils_3.convertMultiOptionsToStringArray)(nodeData.inputs?.agentToolsBuiltInOpenAI)
            if (agentToolsBuiltInOpenAI && agentToolsBuiltInOpenAI.length > 0) {
                for (const tool of agentToolsBuiltInOpenAI) {
                    const builtInTool = {
                        type: tool
                    }
                    if (tool === 'code_interpreter') {
                        builtInTool.container = { type: 'auto' }
                    }
                    toolsInstance.push(builtInTool)
                    availableTools.push({
                        name: tool,
                        toolNode: {
                            label: tool,
                            name: tool
                        }
                    })
                }
            }
            const agentToolsBuiltInGemini = (0, utils_3.convertMultiOptionsToStringArray)(nodeData.inputs?.agentToolsBuiltInGemini)
            if (agentToolsBuiltInGemini && agentToolsBuiltInGemini.length > 0) {
                for (const tool of agentToolsBuiltInGemini) {
                    const builtInTool = {
                        [tool]: {}
                    }
                    toolsInstance.push(builtInTool)
                    availableTools.push({
                        name: tool,
                        toolNode: {
                            label: tool,
                            name: tool
                        }
                    })
                }
            }
            const agentToolsBuiltInAnthropic = (0, utils_3.convertMultiOptionsToStringArray)(nodeData.inputs?.agentToolsBuiltInAnthropic)
            if (agentToolsBuiltInAnthropic && agentToolsBuiltInAnthropic.length > 0) {
                for (const tool of agentToolsBuiltInAnthropic) {
                    // split _ to get the tool name by removing the last part (date)
                    const toolName = tool.split('_').slice(0, -1).join('_')
                    if (tool === 'code_execution_20250825') {
                        llmNodeInstance.clientOptions = {
                            defaultHeaders: {
                                'anthropic-beta': ['code-execution-2025-08-25', 'files-api-2025-04-14']
                            }
                        }
                    }
                    if (tool === 'web_fetch_20250910') {
                        llmNodeInstance.clientOptions = {
                            defaultHeaders: {
                                'anthropic-beta': ['web-fetch-2025-09-10']
                            }
                        }
                    }
                    const builtInTool = {
                        type: tool,
                        name: toolName
                    }
                    toolsInstance.push(builtInTool)
                    availableTools.push({
                        name: tool,
                        toolNode: {
                            label: tool,
                            name: tool
                        }
                    })
                }
            }
            if (llmNodeInstance && toolsInstance.length > 0) {
                if (llmNodeInstance.bindTools === undefined) {
                    throw new Error(`Agent needs to have a function calling capable models.`)
                }
                // @ts-ignore
                llmNodeInstance = llmNodeInstance.bindTools(toolsInstance)
            }
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
            for (const msg of agentMessages) {
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
                    llmWithoutToolsBind,
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
                 * - Add user message if it does not exist in the agentMessages array
                 */
                if (options.uploads) {
                    const imageContents = await (0, utils_2.getUniqueImageMessages)(options, messages, modelConfig)
                    if (imageContents) {
                        messages.push(imageContents.imageMessageWithBase64)
                    }
                }
                if (input && typeof input === 'string' && !agentMessages.some((msg) => msg.role === 'user')) {
                    messages.push({
                        role: 'user',
                        content: input
                    })
                }
            }
            delete nodeData.inputs?.agentMessages
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
            // Handle tool calls with support for recursion
            let usedTools = []
            let sourceDocuments = []
            let artifacts = []
            let fileAnnotations = []
            let additionalTokens = 0
            let isWaitingForHumanInput = false
            let reasonContent = ''
            let thinkingDuration
            // Store the current messages length to track which messages are added during tool calls
            const messagesBeforeToolCalls = [...messages]
            let _toolCallMessages = []
            /**
             * Add image artifacts from previous assistant responses as user messages.
             * Only the inserted temporary messages contain base64 — other messages are untouched.
             */
            await (0, utils_2.addImageArtifactsToMessages)(messages, options)
            // Check if this is hummanInput for tool calls
            const _humanInput = nodeData.inputs?.humanInput
            const humanInput = typeof _humanInput === 'string' ? JSON.parse(_humanInput) : _humanInput
            const humanInputAction = options.humanInputAction
            const iterationContext = options.iterationContext
            // Track execution time
            const startTime = Date.now()
            // Get initial response from LLM
            const sseStreamer = options.sseStreamer
            if (humanInput) {
                if (humanInput.type !== 'proceed' && humanInput.type !== 'reject') {
                    throw new Error(`Invalid human input type. Expected 'proceed' or 'reject', but got '${humanInput.type}'`)
                }
                const result = await this.handleResumedToolCalls({
                    humanInput,
                    humanInputAction,
                    messages,
                    toolsInstance,
                    sseStreamer,
                    chatId,
                    input,
                    options,
                    abortController,
                    llmWithoutToolsBind,
                    isStreamable,
                    isLastNode,
                    iterationContext,
                    isStructuredOutput
                })
                response = result.response
                usedTools = result.usedTools
                sourceDocuments = result.sourceDocuments
                artifacts = result.artifacts
                additionalTokens = result.totalTokens
                isWaitingForHumanInput = result.isWaitingForHumanInput || false
                if (result.accumulatedReasonContent !== undefined) {
                    reasonContent = result.accumulatedReasonContent
                }
                if (result.accumulatedReasoningDuration !== undefined) {
                    thinkingDuration = result.accumulatedReasoningDuration
                }
                // Calculate which messages were added during tool calls
                _toolCallMessages = messages.slice(messagesBeforeToolCalls.length)
                // Stream additional data if this is the last node
                if (isLastNode && sseStreamer) {
                    if (usedTools.length > 0) {
                        sseStreamer.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools))
                    }
                    if (sourceDocuments.length > 0) {
                        sseStreamer.streamSourceDocumentsEvent(chatId, (0, lodash_1.flatten)(sourceDocuments))
                    }
                    if (artifacts.length > 0) {
                        sseStreamer.streamArtifactsEvent(chatId, (0, lodash_1.flatten)(artifacts))
                    }
                }
            } else {
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
                }
            }
            // Capture reasoning and duration from first LLM response so they can be accumulated across tool-call turns
            if (response.additional_kwargs?.reasoning_content) {
                reasonContent = response.additional_kwargs.reasoning_content || ''
            }
            if (typeof response.additional_kwargs?.reasoning_duration === 'number') {
                thinkingDuration = response.additional_kwargs.reasoning_duration
            }
            // Address built in tools (after artifacts are processed)
            const builtInUsedTools = await this.extractBuiltInUsedTools(response, [])
            if (!humanInput && response.tool_calls && response.tool_calls.length > 0) {
                const result = await this.handleToolCalls({
                    response,
                    messages,
                    toolsInstance,
                    sseStreamer,
                    chatId,
                    input,
                    options,
                    abortController,
                    llmNodeInstance,
                    isStreamable,
                    isLastNode,
                    iterationContext,
                    isStructuredOutput,
                    accumulatedReasonContent: reasonContent,
                    accumulatedReasoningDuration: thinkingDuration
                })
                response = result.response
                usedTools = result.usedTools
                sourceDocuments = result.sourceDocuments
                artifacts = result.artifacts
                additionalTokens = result.totalTokens
                isWaitingForHumanInput = result.isWaitingForHumanInput || false
                if (result.accumulatedReasonContent !== undefined) {
                    reasonContent = result.accumulatedReasonContent
                }
                if (result.accumulatedReasoningDuration !== undefined) {
                    thinkingDuration = result.accumulatedReasoningDuration
                }
                // Calculate which messages were added during tool calls
                _toolCallMessages = messages.slice(messagesBeforeToolCalls.length)
                // Stream additional data if this is the last node
                if (isLastNode && sseStreamer) {
                    if (usedTools.length > 0) {
                        sseStreamer.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools))
                    }
                    if (sourceDocuments.length > 0) {
                        sseStreamer.streamSourceDocumentsEvent(chatId, (0, lodash_1.flatten)(sourceDocuments))
                    }
                    if (artifacts.length > 0) {
                        sseStreamer.streamArtifactsEvent(chatId, (0, lodash_1.flatten)(artifacts))
                    }
                }
            } else if (!humanInput && !isStreamable && isLastNode && sseStreamer && !isStructuredOutput) {
                // Stream whole response back to UI if not streaming and no tool calls
                // Skip this if structured output is enabled - it will be streamed after conversion
                // Stream thinking content if available
                if (response.contentBlocks?.length) {
                    for (const block of response.contentBlocks) {
                        if (block.type === 'reasoning' && block.reasoning) {
                            reasonContent += block.reasoning
                        }
                        if (block.type === 'thinking' && block.thinking) {
                            reasonContent += block.thinking
                        }
                    }
                    sseStreamer.streamThinkingEvent(chatId, reasonContent)
                    // Send end of thinking event with duration from token details if available
                    const reasoningTokens = response.usage_metadata?.output_token_details?.reasoning || 0
                    // Estimate duration based on reasoning tokens (rough estimate: ~50 tokens/sec)
                    thinkingDuration = reasoningTokens > 0 ? Math.round(reasoningTokens / 50) : 2
                    sseStreamer.streamThinkingEvent(chatId, '', thinkingDuration)
                }
                sseStreamer.streamTokenEvent(chatId, (0, utils_3.extractResponseContent)(response))
            }
            // Calculate execution time
            const endTime = Date.now()
            const timeDelta = endTime - startTime
            // Update flow state if needed
            let newState = { ...state }
            if (_agentUpdateState && Array.isArray(_agentUpdateState) && _agentUpdateState.length > 0) {
                newState = (0, utils_2.updateFlowState)(state, _agentUpdateState)
            }
            // Clean up empty inputs
            for (const key in nodeData.inputs) {
                if (nodeData.inputs[key] === '') {
                    delete nodeData.inputs[key]
                }
            }
            // Prepare final response and output object
            let finalResponse = ''
            if (response.content && Array.isArray(response.content)) {
                // Process items and concatenate consecutive text items
                const processedParts = []
                let currentTextBuffer = ''
                for (const item of response.content) {
                    const itemAny = item
                    const isTextItem = (itemAny.text && !itemAny.type) || (itemAny.type === 'text' && itemAny.text)
                    if (isTextItem) {
                        // Accumulate consecutive text items
                        currentTextBuffer += itemAny.text
                    } else {
                        // Flush accumulated text before processing other types
                        if (currentTextBuffer) {
                            processedParts.push(currentTextBuffer)
                            currentTextBuffer = ''
                        }
                        // Process non-text items
                        if (itemAny.type === 'executableCode' && itemAny.executableCode) {
                            // Format executable code as a code block
                            const language = itemAny.executableCode.language?.toLowerCase() || 'python'
                            processedParts.push(`\n\`\`\`${language}\n${itemAny.executableCode.code}\n\`\`\`\n`)
                        } else if (itemAny.type === 'codeExecutionResult' && itemAny.codeExecutionResult) {
                            // Format code execution result
                            const outcome = itemAny.codeExecutionResult.outcome || 'OUTCOME_OK'
                            const output = itemAny.codeExecutionResult.output || ''
                            if (outcome === 'OUTCOME_OK' && output) {
                                processedParts.push(`**Code Output:**\n\`\`\`\n${output}\n\`\`\`\n`)
                            } else if (outcome !== 'OUTCOME_OK') {
                                processedParts.push(`**Code Execution Error:**\n\`\`\`\n${output}\n\`\`\`\n`)
                            }
                        }
                    }
                }
                // Flush any remaining text
                if (currentTextBuffer) {
                    processedParts.push(currentTextBuffer)
                }
                finalResponse = processedParts.filter((text) => text).join('\n')
            } else if (response.content && typeof response.content === 'string') {
                finalResponse = response.content
            } else if (response.content === '') {
                // Empty response content, this could happen when there is only image data
                finalResponse = ''
            } else {
                finalResponse = JSON.stringify(response, null, 2)
            }
            // Address built in tools
            const additionalBuiltInUsedTools = await this.extractBuiltInUsedTools(response, builtInUsedTools)
            if (additionalBuiltInUsedTools.length > 0) {
                usedTools = [...new Set([...usedTools, ...additionalBuiltInUsedTools])]
                // Stream used tools if this is the last node
                if (isLastNode && sseStreamer) {
                    sseStreamer.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools))
                }
            }
            // Extract artifacts from annotations in response metadata and replace inline data
            if (response.response_metadata) {
                const {
                    artifacts: extractedArtifacts,
                    fileAnnotations: extractedFileAnnotations,
                    savedInlineImages
                } = await (0, utils_2.extractArtifactsFromResponse)(response.response_metadata, newNodeData, options)
                if (extractedArtifacts.length > 0) {
                    artifacts = [...artifacts, ...extractedArtifacts]
                    // Stream artifacts if this is the last node
                    if (isLastNode && sseStreamer) {
                        sseStreamer.streamArtifactsEvent(chatId, extractedArtifacts)
                    }
                }
                if (extractedFileAnnotations.length > 0) {
                    fileAnnotations = [...fileAnnotations, ...extractedFileAnnotations]
                    // Stream file annotations if this is the last node
                    if (isLastNode && sseStreamer) {
                        sseStreamer.streamFileAnnotationsEvent(chatId, fileAnnotations)
                    }
                }
                // Replace inlineData base64 with file references in the response
                if (savedInlineImages && savedInlineImages.length > 0) {
                    ;(0, utils_2.replaceInlineDataWithFileReferences)(response, savedInlineImages)
                }
            }
            // Replace sandbox links with proper download URLs. Example: [Download the script](sandbox:/mnt/data/dummy_bar_graph.py)
            if (finalResponse.includes('sandbox:/')) {
                finalResponse = await this.processSandboxLinks(finalResponse, options.baseURL, options.chatflowid, chatId)
            }
            // If is structured output, then invoke LLM again with structured output at the very end after all tool calls
            if (isStructuredOutput) {
                const structuredllmNodeInstance = (0, utils_3.configureStructuredOutput)(llmWithoutToolsBind, _agentStructuredOutput)
                const prompt = 'Convert the following response to the structured output format: ' + finalResponse
                response = await structuredllmNodeInstance.invoke(prompt, { signal: abortController?.signal })
                // Prefix the response with ```json and suffix with ``` to render as a code block
                if (typeof response === 'object') {
                    finalResponse = '```json\n' + JSON.stringify(response, null, 2) + '\n```'
                } else {
                    finalResponse = response
                }
                if (isLastNode && sseStreamer) {
                    sseStreamer.streamTokenEvent(chatId, finalResponse)
                }
            }
            // Add reasoning content
            if (!reasonContent && response.additional_kwargs?.reasoning_content) {
                reasonContent = response.additional_kwargs.reasoning_content
            }
            if (reasonContent && response.additional_kwargs?.reasoning_duration != null) {
                thinkingDuration = response.additional_kwargs.reasoning_duration
            }
            const reasonContentObj =
                reasonContent !== undefined && reasonContent !== '' ? { thinking: reasonContent, thinkingDuration } : undefined
            const costMetadata = await this.calculateUsageCost(model, modelConfig?.modelName, response.usage_metadata, additionalTokens)
            const output = this.prepareOutputObject(
                response,
                availableTools,
                finalResponse,
                startTime,
                endTime,
                timeDelta,
                usedTools,
                sourceDocuments,
                artifacts,
                additionalTokens,
                isWaitingForHumanInput,
                fileAnnotations,
                isStructuredOutput,
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
            const outputForStateProcessing =
                isStructuredOutput && typeof response === 'object' ? JSON.stringify(response, null, 2) : finalResponse
            newState = (0, utils_3.processTemplateVariables)(newState, outputForStateProcessing)
            /**
             * Remove temporary artifact image messages (they were only needed for the model invoke).
             * Then revert all remaining tagged base64 image_url items back to stored-file format.
             * This is to avoid storing the actual base64 data into database
             */
            const messagesToStore = messages.filter((msg) => !msg._isTemporaryImageMessage)
            const normalizedMessagesToStore = (0, utils_2.normalizeMessagesForStorage)(messagesToStore)
            const messagesWithFileReferences = (0, utils_2.revertBase64ImagesToFileRefs)(normalizedMessagesToStore)
            // Only add to runtime chat history if this is the first node
            const inputMessages = []
            if (!runtimeChatHistory.length) {
                // Include any image file reference messages from uploads in the chat history
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
                        if (!agentMessages.some((msg) => msg.role === 'user')) {
                            inputMessages.push({ role: 'user', content: input })
                        } else {
                            agentMessages.map((msg) => {
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
            const returnResponseAs = nodeData.inputs?.agentReturnResponseAs
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
                    // Add the messages that were specifically added during tool calls, this enable other nodes to see the full tool call history, temporaraily disabled
                    // ...toolCallMessages,
                    // End with the final assistant response
                    {
                        role: returnRole,
                        content: finalResponse,
                        name: nodeData?.label ? nodeData?.label.toLowerCase().replace(/\s/g, '_').trim() : nodeData?.id,
                        ...(((artifacts && artifacts.length > 0) ||
                            (fileAnnotations && fileAnnotations.length > 0) ||
                            (usedTools && usedTools.length > 0)) && {
                            additional_kwargs: {
                                ...(artifacts && artifacts.length > 0 && { artifacts }),
                                ...(fileAnnotations && fileAnnotations.length > 0 && { fileAnnotations }),
                                ...(usedTools && usedTools.length > 0 && { usedTools })
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
            throw new Error(`Error in Agent node: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
    /**
     * Extracts built-in used tools from response metadata and processes image generation results
     */
    async extractBuiltInUsedTools(response, builtInUsedTools = []) {
        if (!response.response_metadata) {
            return builtInUsedTools
        }
        const { output, tools, groundingMetadata, urlContextMetadata } = response.response_metadata
        // Handle OpenAI built-in tools
        if (output && Array.isArray(output) && output.length > 0 && tools && Array.isArray(tools) && tools.length > 0) {
            for (const outputItem of output) {
                if (outputItem.type && outputItem.type.endsWith('_call')) {
                    let toolInput = outputItem.action ?? outputItem.code
                    let toolOutput = outputItem.status === 'completed' ? 'Success' : outputItem.status
                    // Handle image generation calls specially
                    if (outputItem.type === 'image_generation_call') {
                        // Create input summary for image generation
                        toolInput = {
                            prompt: outputItem.revised_prompt || 'Image generation request',
                            size: outputItem.size || '1024x1024',
                            quality: outputItem.quality || 'standard',
                            output_format: outputItem.output_format || 'png'
                        }
                        // Check if image has been processed (base64 replaced with file path)
                        if (outputItem.result && !outputItem.result.startsWith('data:') && !outputItem.result.includes('base64')) {
                            toolOutput = `Image generated and saved`
                        } else {
                            toolOutput = `Image generated (base64)`
                        }
                    }
                    // Remove "_call" suffix to get the base tool name
                    const baseToolName = outputItem.type.replace('_call', '')
                    // Find matching tool that includes the base name in its type
                    const matchingTool = tools.find((tool) => tool.type && tool.type.includes(baseToolName))
                    if (matchingTool) {
                        // Check for duplicates
                        if (builtInUsedTools.find((tool) => tool.tool === matchingTool.type)) {
                            continue
                        }
                        builtInUsedTools.push({
                            tool: matchingTool.type,
                            toolInput,
                            toolOutput
                        })
                    }
                }
            }
        }
        // Handle Gemini googleSearch tool
        if (groundingMetadata && groundingMetadata.webSearchQueries && Array.isArray(groundingMetadata.webSearchQueries)) {
            // Check for duplicates
            const isDuplicate = builtInUsedTools.find(
                (tool) =>
                    tool.tool === 'googleSearch' &&
                    JSON.stringify(tool.toolInput?.queries) === JSON.stringify(groundingMetadata.webSearchQueries)
            )
            if (!isDuplicate) {
                builtInUsedTools.push({
                    tool: 'googleSearch',
                    toolInput: {
                        queries: groundingMetadata.webSearchQueries
                    },
                    toolOutput: `Searched for: ${groundingMetadata.webSearchQueries.join(', ')}`
                })
            }
        }
        // Handle Gemini urlContext tool
        if (urlContextMetadata && urlContextMetadata.urlMetadata && Array.isArray(urlContextMetadata.urlMetadata)) {
            // Check for duplicates
            const isDuplicate = builtInUsedTools.find(
                (tool) =>
                    tool.tool === 'urlContext' &&
                    JSON.stringify(tool.toolInput?.urlMetadata) === JSON.stringify(urlContextMetadata.urlMetadata)
            )
            if (!isDuplicate) {
                builtInUsedTools.push({
                    tool: 'urlContext',
                    toolInput: {
                        urlMetadata: urlContextMetadata.urlMetadata
                    },
                    toolOutput: `Processed ${urlContextMetadata.urlMetadata.length} URL(s)`
                })
            }
        }
        // Handle Gemini codeExecution tool
        if (response.content && Array.isArray(response.content)) {
            for (let i = 0; i < response.content.length; i++) {
                const item = response.content[i]
                if (item.type === 'executableCode' && item.executableCode) {
                    const executableCode = item.executableCode
                    const language = executableCode.language || 'PYTHON'
                    const code = executableCode.code || ''
                    let toolOutput = ''
                    // Check for duplicates
                    const isDuplicate = builtInUsedTools.find(
                        (tool) => tool.tool === 'codeExecution' && tool.toolInput?.language === language && tool.toolInput?.code === code
                    )
                    if (isDuplicate) {
                        continue
                    }
                    // Check the next item for the output
                    const nextItem = i + 1 < response.content.length ? response.content[i + 1] : null
                    if (nextItem) {
                        if (nextItem.type === 'codeExecutionResult' && nextItem.codeExecutionResult) {
                            const codeExecutionResult = nextItem.codeExecutionResult
                            const outcome = codeExecutionResult.outcome
                            const output = codeExecutionResult.output || ''
                            toolOutput = outcome === 'OUTCOME_OK' ? output : `Error: ${output}`
                        } else if (nextItem.type === 'inlineData') {
                            toolOutput = 'Generated image data'
                        }
                    }
                    builtInUsedTools.push({
                        tool: 'codeExecution',
                        toolInput: {
                            language,
                            code
                        },
                        toolOutput
                    })
                }
            }
        }
        return builtInUsedTools
    }
    /**
     * Handles memory management based on the specified memory type
     */
    async handleMemory({
        messages,
        memoryType,
        pastChatHistory,
        runtimeChatHistory,
        llmWithoutToolsBind,
        nodeData,
        userMessage,
        input,
        abortController,
        options,
        modelConfig
    }) {
        const { updatedPastMessages } = await (0, utils_2.getPastChatHistoryImageMessages)(pastChatHistory, options)
        pastChatHistory = updatedPastMessages
        let pastMessages = [...pastChatHistory, ...runtimeChatHistory]
        if (!runtimeChatHistory.length && input && typeof input === 'string') {
            /*
             * If this is the first node:
             * - Add images to messages if exist
             * - Add user message
             */
            if (options.uploads) {
                const imageContents = await (0, utils_2.getUniqueImageMessages)(options, messages, modelConfig)
                if (imageContents) {
                    pastMessages.push(imageContents.imageMessageWithBase64)
                }
            }
            pastMessages.push({
                role: 'user',
                content: input
            })
        }
        const { updatedMessages } = await (0, utils_2.processMessagesWithImages)(pastMessages, options)
        pastMessages = updatedMessages
        if (pastMessages.length > 0) {
            if (memoryType === 'windowSize') {
                // Window memory: Keep the last N messages
                const windowSize = nodeData.inputs?.agentMemoryWindowSize
                const windowedMessages = pastMessages.slice(-windowSize * 2)
                messages.push(...windowedMessages)
            } else if (memoryType === 'conversationSummary') {
                // Summary memory: Summarize all past messages
                const summary = await llmWithoutToolsBind.invoke(
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
                messages.push({ role: 'assistant', content: (0, utils_3.extractResponseContent)(summary) })
                if (!userMessage && input && typeof input === 'string') {
                    messages.push({
                        role: 'user',
                        content: input
                    })
                }
            } else if (memoryType === 'conversationSummaryBuffer') {
                // Summary buffer: Summarize messages that exceed token limit
                await this.handleSummaryBuffer(messages, pastMessages, llmWithoutToolsBind, nodeData, abortController)
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
    async handleSummaryBuffer(messages, pastMessages, llmWithoutToolsBind, nodeData, abortController) {
        const maxTokenLimit = nodeData.inputs?.agentMemoryMaxTokenLimit || 2000
        // Convert past messages to a format suitable for token counting
        const messagesString = pastMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
        const tokenCount = await llmWithoutToolsBind.getNumTokens(messagesString)
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
                    currBufferLength = await llmWithoutToolsBind.getNumTokens(remainingMessagesString)
                }
            }
            // Summarize the messages that were removed
            const messagesToSummarizeString = messagesToSummarize.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
            const summary = await llmWithoutToolsBind.invoke(
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
            messages.push({ role: summaryRole, content: `Previous conversation summary: ${(0, utils_3.extractResponseContent)(summary)}` })
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
                                // As soon as we see the first non-reasoning block, send last thinking event with duration
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
                        content = chunk.content
                            .map((item) => {
                                if ((item.text && !item.type) || (item.type === 'text' && item.text)) {
                                    return item.text
                                } else if (item.type === 'executableCode' && item.executableCode) {
                                    const language = item.executableCode.language?.toLowerCase() || 'python'
                                    return `\n\`\`\`${language}\n${item.executableCode.code}\n\`\`\`\n`
                                } else if (item.type === 'codeExecutionResult' && item.codeExecutionResult) {
                                    const outcome = item.codeExecutionResult.outcome || 'OUTCOME_OK'
                                    const output = item.codeExecutionResult.output || ''
                                    if (outcome === 'OUTCOME_OK' && output) {
                                        return `**Code Output:**\n\`\`\`\n${output}\n\`\`\`\n`
                                    } else if (outcome !== 'OUTCOME_OK') {
                                        return `**Code Execution Error:**\n\`\`\`\n${output}\n\`\`\`\n`
                                    }
                                }
                                return ''
                            })
                            .filter((text) => text)
                            .join('')
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
    async calculateUsageCost(provider, modelName, usageMetadata, additionalTokens = 0) {
        if (!provider || !modelName) return undefined
        const inputTokens = usageMetadata?.input_tokens ?? 0
        const outputTokens = (usageMetadata?.output_tokens ?? 0) + additionalTokens
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
        availableTools,
        finalResponse,
        startTime,
        endTime,
        timeDelta,
        usedTools,
        sourceDocuments,
        artifacts,
        additionalTokens = 0,
        isWaitingForHumanInput = false,
        fileAnnotations = [],
        isStructuredOutput = false,
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
        // Include token usage metadata with accumulated tokens from tool calls
        if (response.usage_metadata) {
            const originalTokens = response.usage_metadata.total_tokens || 0
            output.usageMetadata = {
                ...response.usage_metadata,
                total_tokens: originalTokens + additionalTokens,
                tool_call_tokens: additionalTokens
            }
        } else if (additionalTokens > 0) {
            // If no original usage metadata but we have tool tokens
            output.usageMetadata = {
                total_tokens: additionalTokens,
                tool_call_tokens: additionalTokens
            }
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
        // Add used tools, source documents and artifacts to output
        if (usedTools && usedTools.length > 0) {
            output.usedTools = (0, lodash_1.flatten)(usedTools)
        }
        if (sourceDocuments && sourceDocuments.length > 0) {
            output.sourceDocuments = (0, lodash_1.flatten)(sourceDocuments)
        }
        if (artifacts && artifacts.length > 0) {
            output.artifacts = (0, lodash_1.flatten)(artifacts)
        }
        if (availableTools && availableTools.length > 0) {
            output.availableTools = availableTools
        }
        if (isWaitingForHumanInput) {
            output.isWaitingForHumanInput = isWaitingForHumanInput
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
    /**
     * Handles tool calls and their responses, with support for recursive tool calling
     */
    async handleToolCalls({
        response,
        messages,
        toolsInstance,
        sseStreamer,
        chatId,
        input,
        options,
        abortController,
        llmNodeInstance,
        isStreamable,
        isLastNode,
        iterationContext,
        isStructuredOutput = false,
        accumulatedReasonContent: initialAccumulatedReasonContent,
        accumulatedReasoningDuration: initialAccumulatedReasoningDuration
    }) {
        // Track total tokens used throughout this process
        let totalTokens = response.usage_metadata?.total_tokens || 0
        const usedTools = []
        let sourceDocuments = []
        let artifacts = []
        let isWaitingForHumanInput
        // Use reasoning from caller (first turn); subsequent turns are added when we get newResponse
        let accumulatedReasonContent = initialAccumulatedReasonContent ?? ''
        let accumulatedReasoningDuration = initialAccumulatedReasoningDuration ?? 0
        if (!response.tool_calls || response.tool_calls.length === 0) {
            return {
                response,
                usedTools: [],
                sourceDocuments: [],
                artifacts: [],
                totalTokens,
                accumulatedReasonContent: accumulatedReasonContent || undefined,
                accumulatedReasoningDuration: accumulatedReasoningDuration || undefined
            }
        }
        // Stream tool calls if available
        if (sseStreamer) {
            const formattedToolCalls = response.tool_calls.map((toolCall) => ({
                tool: toolCall.name || 'tool',
                toolInput: toolCall.args,
                toolOutput: ''
            }))
            sseStreamer.streamCalledToolsEvent(chatId, (0, lodash_1.flatten)(formattedToolCalls))
        }
        // Remove tool calls with no id
        const toBeRemovedToolCalls = []
        for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i]
            if (!toolCall.id) {
                toBeRemovedToolCalls.push(toolCall)
                usedTools.push({
                    tool: toolCall.name || 'tool',
                    toolInput: toolCall.args,
                    toolOutput: response.content
                })
            }
        }
        for (const toolCall of toBeRemovedToolCalls) {
            response.tool_calls.splice(response.tool_calls.indexOf(toolCall), 1)
        }
        // Add LLM response with tool calls to messages
        messages.push(response)
        // Process each tool call
        for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i]
            const selectedTool = toolsInstance.find((tool) => tool.name === toolCall.name)
            if (selectedTool) {
                let parsedDocs
                let parsedArtifacts
                let isToolRequireHumanInput =
                    selectedTool.requiresHumanInput && (!iterationContext || Object.keys(iterationContext).length === 0)
                const flowConfig = {
                    chatflowId: options.chatflowid,
                    sessionId: options.sessionId,
                    chatId: options.chatId,
                    input: input,
                    state: options.agentflowRuntime?.state
                }
                if (isToolRequireHumanInput) {
                    const toolCallDetails = '```json\n' + JSON.stringify(toolCall, null, 2) + '\n```'
                    const responseContent = response.content + `\nAttempting to use tool:\n${toolCallDetails}`
                    response.content = responseContent
                    if (!isStructuredOutput) {
                        sseStreamer?.streamTokenEvent(chatId, responseContent)
                    }
                    return {
                        response,
                        usedTools,
                        sourceDocuments,
                        artifacts,
                        totalTokens,
                        isWaitingForHumanInput: true,
                        accumulatedReasonContent: accumulatedReasonContent || undefined,
                        accumulatedReasoningDuration: accumulatedReasoningDuration || undefined
                    }
                }
                let toolIds
                if (options.analyticHandlers) {
                    toolIds = await options.analyticHandlers.onToolStart(toolCall.name, toolCall.args, options.parentTraceIds)
                }
                try {
                    //@ts-ignore
                    let toolOutput = await selectedTool.call(toolCall.args, { signal: abortController?.signal }, undefined, flowConfig)
                    // Normalize to string — some tools (e.g. @langchain/tavily v1.2+) return objects
                    if (toolOutput !== null && toolOutput !== undefined && typeof toolOutput !== 'string') {
                        toolOutput = JSON.stringify(toolOutput)
                    }
                    if (options.analyticHandlers && toolIds) {
                        await options.analyticHandlers.onToolEnd(toolIds, toolOutput)
                    }
                    // Extract source documents if present
                    if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.SOURCE_DOCUMENTS_PREFIX)) {
                        const [output, docs] = toolOutput.split(agents_1.SOURCE_DOCUMENTS_PREFIX)
                        toolOutput = output
                        try {
                            parsedDocs = JSON.parse(docs)
                            sourceDocuments.push(parsedDocs)
                        } catch (e) {
                            console.error('Error parsing source documents from tool:', e)
                        }
                    }
                    // Extract artifacts if present
                    if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.ARTIFACTS_PREFIX)) {
                        const [output, artifact] = toolOutput.split(agents_1.ARTIFACTS_PREFIX)
                        toolOutput = output
                        try {
                            parsedArtifacts = JSON.parse(artifact)
                            artifacts.push(parsedArtifacts)
                        } catch (e) {
                            console.error('Error parsing artifacts from tool:', e)
                        }
                    }
                    let toolInput
                    if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.TOOL_ARGS_PREFIX)) {
                        const [output, args] = toolOutput.split(agents_1.TOOL_ARGS_PREFIX)
                        toolOutput = output
                        try {
                            toolInput = JSON.parse(args)
                        } catch (e) {
                            console.error('Error parsing tool input from tool:', e)
                        }
                    }
                    // Add tool message to conversation
                    messages.push({
                        role: 'tool',
                        content: toolOutput,
                        tool_call_id: toolCall.id,
                        name: toolCall.name,
                        additional_kwargs: {
                            artifacts: parsedArtifacts,
                            sourceDocuments: parsedDocs
                        }
                    })
                    // Track used tools
                    usedTools.push({
                        tool: toolCall.name,
                        toolInput: toolInput ?? toolCall.args,
                        toolOutput
                    })
                } catch (e) {
                    if (options.analyticHandlers && toolIds) {
                        await options.analyticHandlers.onToolEnd(toolIds, e)
                    }
                    console.error('Error invoking tool:', e)
                    const errMsg = (0, error_1.getErrorMessage)(e)
                    let toolInput = toolCall.args
                    if (typeof errMsg === 'string' && errMsg.includes(agents_1.TOOL_ARGS_PREFIX)) {
                        const [_, args] = errMsg.split(agents_1.TOOL_ARGS_PREFIX)
                        try {
                            toolInput = JSON.parse(args)
                        } catch (e) {
                            console.error('Error parsing tool input from tool:', e)
                        }
                    }
                    usedTools.push({
                        tool: selectedTool.name,
                        toolInput,
                        toolOutput: '',
                        error: (0, error_1.getErrorMessage)(e)
                    })
                    sseStreamer?.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools))
                    throw new Error((0, error_1.getErrorMessage)(e))
                }
            }
        }
        // Return direct tool output if there's exactly one tool with returnDirect
        if (response.tool_calls.length === 1) {
            const selectedTool = toolsInstance.find((tool) => tool.name === response.tool_calls?.[0]?.name)
            if (selectedTool && selectedTool.returnDirect) {
                const lastToolOutput = usedTools[0]?.toolOutput || ''
                const lastToolOutputString = typeof lastToolOutput === 'string' ? lastToolOutput : JSON.stringify(lastToolOutput, null, 2)
                if (sseStreamer && !isStructuredOutput) {
                    sseStreamer.streamTokenEvent(chatId, lastToolOutputString)
                }
                return {
                    response: new messages_1.AIMessageChunk(lastToolOutputString),
                    usedTools,
                    sourceDocuments,
                    artifacts,
                    totalTokens,
                    accumulatedReasonContent: accumulatedReasonContent || undefined,
                    accumulatedReasoningDuration: accumulatedReasoningDuration || undefined
                }
            }
        }
        if (response.tool_calls.length === 0) {
            const responseContent = (0, utils_3.extractResponseContent)(response)
            return {
                response: new messages_1.AIMessageChunk(responseContent),
                usedTools,
                sourceDocuments,
                artifacts,
                totalTokens,
                accumulatedReasonContent: accumulatedReasonContent || undefined,
                accumulatedReasoningDuration: accumulatedReasoningDuration || undefined
            }
        }
        // Get LLM response after tool calls
        let newResponse
        if (isStreamable) {
            newResponse = await this.handleStreamingResponse(
                sseStreamer,
                llmNodeInstance,
                messages,
                chatId,
                abortController,
                isStructuredOutput,
                isLastNode
            )
        } else {
            newResponse = await llmNodeInstance.invoke(messages, { signal: abortController?.signal })
            // Stream non-streaming response if this is the last node
            if (isLastNode && sseStreamer && !isStructuredOutput) {
                sseStreamer.streamTokenEvent(chatId, (0, utils_3.extractResponseContent)(newResponse))
            }
        }
        // Add tokens from this response
        if (newResponse.usage_metadata?.total_tokens) {
            totalTokens += newResponse.usage_metadata.total_tokens
        }
        // Accumulate this turn's reasoning content and duration
        if (newResponse.additional_kwargs?.reasoning_content) {
            const chunkReason = newResponse.additional_kwargs.reasoning_content
            accumulatedReasonContent += (accumulatedReasonContent ? '\n\n' : '') + chunkReason
        }
        if (typeof newResponse.additional_kwargs?.reasoning_duration === 'number') {
            accumulatedReasoningDuration += newResponse.additional_kwargs.reasoning_duration
        }
        // Check for recursive tool calls and handle them
        if (newResponse.tool_calls && newResponse.tool_calls.length > 0) {
            const {
                response: recursiveResponse,
                usedTools: recursiveUsedTools,
                sourceDocuments: recursiveSourceDocuments,
                artifacts: recursiveArtifacts,
                totalTokens: recursiveTokens,
                isWaitingForHumanInput: recursiveIsWaitingForHumanInput,
                accumulatedReasonContent: recursiveAccumulatedReasonContent,
                accumulatedReasoningDuration: recursiveAccumulatedReasoningDuration
            } = await this.handleToolCalls({
                response: newResponse,
                messages,
                toolsInstance,
                sseStreamer,
                chatId,
                input,
                options,
                abortController,
                llmNodeInstance,
                isStreamable,
                isLastNode,
                iterationContext,
                isStructuredOutput,
                accumulatedReasonContent,
                accumulatedReasoningDuration
            })
            // Merge results from recursive tool calls
            newResponse = recursiveResponse
            usedTools.push(...recursiveUsedTools)
            sourceDocuments = [...sourceDocuments, ...recursiveSourceDocuments]
            artifacts = [...artifacts, ...recursiveArtifacts]
            totalTokens += recursiveTokens
            isWaitingForHumanInput = recursiveIsWaitingForHumanInput
            if (recursiveAccumulatedReasonContent !== undefined) {
                accumulatedReasonContent = recursiveAccumulatedReasonContent
            }
            if (recursiveAccumulatedReasoningDuration !== undefined) {
                accumulatedReasoningDuration = recursiveAccumulatedReasoningDuration
            }
        }
        return {
            response: newResponse,
            usedTools,
            sourceDocuments,
            artifacts,
            totalTokens,
            isWaitingForHumanInput,
            accumulatedReasonContent: accumulatedReasonContent || undefined,
            accumulatedReasoningDuration: accumulatedReasoningDuration || undefined
        }
    }
    /**
     * Handles tool calls and their responses, with support for recursive tool calling
     */
    async handleResumedToolCalls({
        humanInput,
        humanInputAction,
        messages,
        toolsInstance,
        sseStreamer,
        chatId,
        input,
        options,
        abortController,
        llmWithoutToolsBind,
        isStreamable,
        isLastNode,
        iterationContext,
        isStructuredOutput = false
    }) {
        let llmNodeInstance = llmWithoutToolsBind
        const usedTools = []
        let sourceDocuments = []
        let artifacts = []
        let isWaitingForHumanInput
        const lastCheckpointMessages = humanInputAction?.data?.input?.messages ?? []
        if (!lastCheckpointMessages.length) {
            return {
                response: new messages_1.AIMessageChunk(''),
                usedTools: [],
                sourceDocuments: [],
                artifacts: [],
                totalTokens: 0,
                accumulatedReasonContent: undefined,
                accumulatedReasoningDuration: undefined
            }
        }
        // Use the last message as the response
        const response = lastCheckpointMessages[lastCheckpointMessages.length - 1]
        // Replace messages array
        messages.length = 0
        messages.push(...lastCheckpointMessages.slice(0, lastCheckpointMessages.length - 1))
        // Track total tokens used throughout this process
        let totalTokens = response.usage_metadata?.total_tokens || 0
        if (!response.tool_calls || response.tool_calls.length === 0) {
            const acc = response.additional_kwargs?.reasoning_content || undefined
            const dur =
                typeof response.additional_kwargs?.reasoning_duration === 'number'
                    ? response.additional_kwargs.reasoning_duration
                    : undefined
            return {
                response,
                usedTools: [],
                sourceDocuments: [],
                artifacts: [],
                totalTokens,
                accumulatedReasonContent: acc,
                accumulatedReasoningDuration: dur
            }
        }
        // Stream tool calls if available
        if (sseStreamer) {
            const formattedToolCalls = response.tool_calls.map((toolCall) => ({
                tool: toolCall.name || 'tool',
                toolInput: toolCall.args,
                toolOutput: ''
            }))
            sseStreamer.streamCalledToolsEvent(chatId, (0, lodash_1.flatten)(formattedToolCalls))
        }
        // Remove tool calls with no id
        const toBeRemovedToolCalls = []
        for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i]
            if (!toolCall.id) {
                toBeRemovedToolCalls.push(toolCall)
                usedTools.push({
                    tool: toolCall.name || 'tool',
                    toolInput: toolCall.args,
                    toolOutput: response.content
                })
            }
        }
        for (const toolCall of toBeRemovedToolCalls) {
            response.tool_calls.splice(response.tool_calls.indexOf(toolCall), 1)
        }
        // Add LLM response with tool calls to messages
        messages.push(response)
        // Process each tool call
        for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i]
            const selectedTool = toolsInstance.find((tool) => tool.name === toolCall.name)
            if (selectedTool) {
                let parsedDocs
                let parsedArtifacts
                const flowConfig = {
                    chatflowId: options.chatflowid,
                    sessionId: options.sessionId,
                    chatId: options.chatId,
                    input: input,
                    state: options.agentflowRuntime?.state
                }
                if (humanInput.type === 'reject') {
                    messages.pop()
                    const toBeRemovedTool = toolsInstance.find((tool) => tool.name === toolCall.name)
                    if (toBeRemovedTool) {
                        toolsInstance = toolsInstance.filter((tool) => tool.name !== toolCall.name)
                        // Remove other tools with the same agentSelectedTool such as MCP tools
                        toolsInstance = toolsInstance.filter((tool) => tool.agentSelectedTool !== toBeRemovedTool.agentSelectedTool)
                    }
                }
                if (humanInput.type === 'proceed') {
                    let toolIds
                    if (options.analyticHandlers) {
                        toolIds = await options.analyticHandlers.onToolStart(toolCall.name, toolCall.args, options.parentTraceIds)
                    }
                    try {
                        //@ts-ignore
                        let toolOutput = await selectedTool.call(toolCall.args, { signal: abortController?.signal }, undefined, flowConfig)
                        if (options.analyticHandlers && toolIds) {
                            await options.analyticHandlers.onToolEnd(toolIds, toolOutput)
                        }
                        // Extract source documents if present
                        if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.SOURCE_DOCUMENTS_PREFIX)) {
                            const [output, docs] = toolOutput.split(agents_1.SOURCE_DOCUMENTS_PREFIX)
                            toolOutput = output
                            try {
                                parsedDocs = JSON.parse(docs)
                                sourceDocuments.push(parsedDocs)
                            } catch (e) {
                                console.error('Error parsing source documents from tool:', e)
                            }
                        }
                        // Extract artifacts if present
                        if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.ARTIFACTS_PREFIX)) {
                            const [output, artifact] = toolOutput.split(agents_1.ARTIFACTS_PREFIX)
                            toolOutput = output
                            try {
                                parsedArtifacts = JSON.parse(artifact)
                                artifacts.push(parsedArtifacts)
                            } catch (e) {
                                console.error('Error parsing artifacts from tool:', e)
                            }
                        }
                        let toolInput
                        if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.TOOL_ARGS_PREFIX)) {
                            const [output, args] = toolOutput.split(agents_1.TOOL_ARGS_PREFIX)
                            toolOutput = output
                            try {
                                toolInput = JSON.parse(args)
                            } catch (e) {
                                console.error('Error parsing tool input from tool:', e)
                            }
                        }
                        // Add tool message to conversation
                        messages.push({
                            role: 'tool',
                            content: toolOutput,
                            tool_call_id: toolCall.id,
                            name: toolCall.name,
                            additional_kwargs: {
                                artifacts: parsedArtifacts,
                                sourceDocuments: parsedDocs
                            }
                        })
                        // Track used tools
                        usedTools.push({
                            tool: toolCall.name,
                            toolInput: toolInput ?? toolCall.args,
                            toolOutput
                        })
                    } catch (e) {
                        if (options.analyticHandlers && toolIds) {
                            await options.analyticHandlers.onToolEnd(toolIds, e)
                        }
                        console.error('Error invoking tool:', e)
                        const errMsg = (0, error_1.getErrorMessage)(e)
                        let toolInput = toolCall.args
                        if (typeof errMsg === 'string' && errMsg.includes(agents_1.TOOL_ARGS_PREFIX)) {
                            const [_, args] = errMsg.split(agents_1.TOOL_ARGS_PREFIX)
                            try {
                                toolInput = JSON.parse(args)
                            } catch (e) {
                                console.error('Error parsing tool input from tool:', e)
                            }
                        }
                        usedTools.push({
                            tool: selectedTool.name,
                            toolInput,
                            toolOutput: '',
                            error: (0, error_1.getErrorMessage)(e)
                        })
                        sseStreamer?.streamUsedToolsEvent(chatId, (0, lodash_1.flatten)(usedTools))
                        throw new Error((0, error_1.getErrorMessage)(e))
                    }
                }
            }
        }
        // Return direct tool output if there's exactly one tool with returnDirect
        if (response.tool_calls.length === 1) {
            const selectedTool = toolsInstance.find((tool) => tool.name === response.tool_calls?.[0]?.name)
            if (selectedTool && selectedTool.returnDirect) {
                const lastToolOutput = usedTools[0]?.toolOutput || ''
                const lastToolOutputString = typeof lastToolOutput === 'string' ? lastToolOutput : JSON.stringify(lastToolOutput, null, 2)
                if (sseStreamer && !isStructuredOutput) {
                    sseStreamer.streamTokenEvent(chatId, lastToolOutputString)
                }
                const acc = response.additional_kwargs?.reasoning_content || undefined
                const dur =
                    typeof response.additional_kwargs?.reasoning_duration === 'number'
                        ? response.additional_kwargs.reasoning_duration
                        : undefined
                return {
                    response: new messages_1.AIMessageChunk(lastToolOutputString),
                    usedTools,
                    sourceDocuments,
                    artifacts,
                    totalTokens,
                    accumulatedReasonContent: acc,
                    accumulatedReasoningDuration: dur
                }
            }
        }
        // Get LLM response after tool calls
        let newResponse
        if (llmNodeInstance && llmNodeInstance.builtInTools && llmNodeInstance.builtInTools.length > 0) {
            toolsInstance.push(...llmNodeInstance.builtInTools)
        }
        if (llmNodeInstance && toolsInstance.length > 0) {
            if (llmNodeInstance.bindTools === undefined) {
                throw new Error(`Agent needs to have a function calling capable models.`)
            }
            // @ts-ignore
            llmNodeInstance = llmNodeInstance.bindTools(toolsInstance)
        }
        if (isStreamable) {
            newResponse = await this.handleStreamingResponse(
                sseStreamer,
                llmNodeInstance,
                messages,
                chatId,
                abortController,
                isStructuredOutput,
                isLastNode
            )
        } else {
            newResponse = await llmNodeInstance.invoke(messages, { signal: abortController?.signal })
            // Stream non-streaming response if this is the last node
            if (isLastNode && sseStreamer && !isStructuredOutput) {
                sseStreamer.streamTokenEvent(chatId, (0, utils_3.extractResponseContent)(newResponse))
            }
        }
        // Add tokens from this response
        if (newResponse.usage_metadata?.total_tokens) {
            totalTokens += newResponse.usage_metadata.total_tokens
        }
        // Accumulate reasoning and duration from checkpoint response and this turn
        let accumulatedReasonContent = response.additional_kwargs?.reasoning_content || ''
        if (newResponse.additional_kwargs?.reasoning_content) {
            accumulatedReasonContent += (accumulatedReasonContent ? '\n\n' : '') + newResponse.additional_kwargs.reasoning_content
        }
        let accumulatedReasoningDuration =
            (typeof response.additional_kwargs?.reasoning_duration === 'number' ? response.additional_kwargs.reasoning_duration : 0) +
            (typeof newResponse.additional_kwargs?.reasoning_duration === 'number' ? newResponse.additional_kwargs.reasoning_duration : 0)
        // Check for recursive tool calls and handle them
        if (newResponse.tool_calls && newResponse.tool_calls.length > 0) {
            const {
                response: recursiveResponse,
                usedTools: recursiveUsedTools,
                sourceDocuments: recursiveSourceDocuments,
                artifacts: recursiveArtifacts,
                totalTokens: recursiveTokens,
                isWaitingForHumanInput: recursiveIsWaitingForHumanInput,
                accumulatedReasonContent: recursiveAccumulatedReasonContent,
                accumulatedReasoningDuration: recursiveAccumulatedReasoningDuration
            } = await this.handleToolCalls({
                response: newResponse,
                messages,
                toolsInstance,
                sseStreamer,
                chatId,
                input,
                options,
                abortController,
                llmNodeInstance,
                isStreamable,
                isLastNode,
                iterationContext,
                isStructuredOutput,
                accumulatedReasonContent,
                accumulatedReasoningDuration
            })
            // Merge results from recursive tool calls
            newResponse = recursiveResponse
            usedTools.push(...recursiveUsedTools)
            sourceDocuments = [...sourceDocuments, ...recursiveSourceDocuments]
            artifacts = [...artifacts, ...recursiveArtifacts]
            totalTokens += recursiveTokens
            isWaitingForHumanInput = recursiveIsWaitingForHumanInput
            if (recursiveAccumulatedReasonContent !== undefined) {
                accumulatedReasonContent = recursiveAccumulatedReasonContent
            }
            if (recursiveAccumulatedReasoningDuration !== undefined) {
                accumulatedReasoningDuration = recursiveAccumulatedReasoningDuration
            }
        }
        return {
            response: newResponse,
            usedTools,
            sourceDocuments,
            artifacts,
            totalTokens,
            isWaitingForHumanInput,
            accumulatedReasonContent: accumulatedReasonContent || undefined,
            accumulatedReasoningDuration: accumulatedReasoningDuration || undefined
        }
    }
    /**
     * Processes sandbox links in the response text and converts them to file annotations
     */
    async processSandboxLinks(text, baseURL, chatflowId, chatId) {
        let processedResponse = text
        // Regex to match sandbox links: [text](sandbox:/path/to/file)
        const sandboxLinkRegex = /\[([^\]]+)\]\(sandbox:\/([^)]+)\)/g
        const matches = Array.from(text.matchAll(sandboxLinkRegex))
        for (const match of matches) {
            const fullMatch = match[0]
            const linkText = match[1]
            const filePath = match[2]
            try {
                // Extract and sanitize filename from the file path (LLM-generated, untrusted)
                const fileName = (0, validator_1.sanitizeFileName)(filePath)
                // Replace sandbox link with proper download URL
                const downloadUrl = `${baseURL}/api/get-upload-file?chatflowId=${chatflowId}&chatId=${chatId}&fileName=${fileName}&download=true`
                const newLink = `[${linkText}](${downloadUrl})`
                processedResponse = processedResponse.replace(fullMatch, newLink)
            } catch (error) {
                console.error('Error processing sandbox link:', error)
                // If there's an error, remove the sandbox link as fallback
                processedResponse = processedResponse.replace(fullMatch, linkText)
            }
        }
        return processedResponse
    }
}
module.exports = { nodeClass: Agent_Agentflow }
//# sourceMappingURL=Agent.js.map
