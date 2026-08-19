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
const utils_1 = require('../utils')
const utils_2 = require('../../../src/utils')
const agents_1 = require('../../../src/agents')
const utils_3 = require('../../../src/utils')
const toolPolicy_1 = require('../../../src/toolPolicy')
class Tool_Agentflow {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
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
            async listToolInputArgs(nodeData, options) {
                const currentNode = options.currentNode
                const selectedTool = currentNode?.inputs?.selectedTool || currentNode?.inputs?.toolAgentflowSelectedTool
                const selectedToolConfig =
                    currentNode?.inputs?.selectedToolConfig || currentNode?.inputs?.toolAgentflowSelectedToolConfig || {}
                const nodeInstanceFilePath = options.componentNodes[selectedTool].filePath
                const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
                const newToolNodeInstance = new nodeModule.nodeClass()
                const newNodeData = {
                    ...nodeData,
                    credential: selectedToolConfig['FLOWISE_CREDENTIAL_ID'],
                    inputs: {
                        ...nodeData.inputs,
                        ...selectedToolConfig
                    }
                }
                try {
                    const toolInstance = await newToolNodeInstance.init(newNodeData, '', options)
                    let toolInputArgs = {}
                    if (Array.isArray(toolInstance)) {
                        // Combine schemas from all tools in the array
                        const allProperties = toolInstance.reduce((acc, tool) => {
                            if (tool?.schema) {
                                const schema = (0, utils_3.toolSchemaToJsonSchema)(tool.schema)
                                return { ...acc, ...(schema.properties || {}) }
                            }
                            return acc
                        }, {})
                        toolInputArgs = { properties: allProperties }
                    } else if (!toolInstance.schema) {
                        toolInputArgs = {}
                    } else {
                        toolInputArgs = (0, utils_3.toolSchemaToJsonSchema)(toolInstance.schema)
                    }
                    return Object.keys(toolInputArgs.properties || {}).map((item) => ({
                        label: item,
                        name: item,
                        description: toolInputArgs.properties[item].description
                    }))
                } catch (e) {
                    return []
                }
            },
            async listRuntimeStateKeys(_, options) {
                const previousNodes = options.previousNodes
                const startAgentflowNode = previousNodes.find((node) => node.name === 'startAgentflow')
                const state = startAgentflowNode?.inputs?.startState
                return state.map((item) => ({ label: item.key, name: item.key }))
            }
        }
        this.label = 'Tool'
        this.name = 'toolAgentflow'
        this.version = 1.2
        this.type = 'Tool'
        this.category = 'Agent Flows'
        this.description = 'Tools allow LLM to interact with external systems'
        this.baseClasses = [this.type]
        this.color = '#d4a373'
        this.inputs = [
            {
                label: 'Tool',
                name: 'toolAgentflowSelectedTool',
                type: 'asyncOptions',
                loadMethod: 'listTools',
                loadConfig: true
            },
            {
                label: 'Tool Input Arguments',
                name: 'toolInputArgs',
                type: 'array',
                acceptVariable: true,
                refresh: true,
                array: [
                    {
                        label: 'Input Argument Name',
                        name: 'inputArgName',
                        type: 'asyncOptions',
                        loadMethod: 'listToolInputArgs',
                        refresh: true
                    },
                    {
                        label: 'Input Argument Value',
                        name: 'inputArgValue',
                        type: 'string',
                        acceptVariable: true
                    }
                ],
                show: {
                    toolAgentflowSelectedTool: '.+'
                }
            },
            {
                label: 'Update Flow State',
                name: 'toolUpdateState',
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
        const selectedTool = nodeData.inputs?.selectedTool || nodeData.inputs?.toolAgentflowSelectedTool
        const selectedToolConfig = nodeData?.inputs?.selectedToolConfig || nodeData?.inputs?.toolAgentflowSelectedToolConfig || {}
        const toolInputArgs = nodeData.inputs?.toolInputArgs
        const _toolUpdateState = nodeData.inputs?.toolUpdateState
        const state = options.agentflowRuntime?.state
        const chatId = options.chatId
        const isLastNode = options.isLastNode
        const isStreamable = isLastNode && options.sseStreamer !== undefined
        const abortController = options.abortController
        // Update flow state if needed
        let newState = { ...state }
        if (_toolUpdateState && Array.isArray(_toolUpdateState) && _toolUpdateState.length > 0) {
            newState = (0, utils_1.updateFlowState)(state, _toolUpdateState)
        }
        if (!selectedTool) {
            throw new Error('Tool not selected')
        }
        const nodeInstanceFilePath = options.componentNodes[selectedTool].filePath
        const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then((s) => __importStar(require(s)))
        const newToolNodeInstance = new nodeModule.nodeClass()
        const newNodeData = {
            ...nodeData,
            credential: selectedToolConfig['FLOWISE_CREDENTIAL_ID'],
            inputs: {
                ...nodeData.inputs,
                ...selectedToolConfig
            }
        }
        let toolInstance = await newToolNodeInstance.init(newNodeData, '', options)
        toolInstance = (0, toolPolicy_1.wrapToolWithPolicy)(
            toolInstance,
            {
                workspaceId: options.workspaceId,
                chatflowId: options.chatflowid,
                toolNodeName: selectedTool,
                userId: options.userId,
                credentialId: newNodeData.credential
            },
            options
        )
        let toolCallArgs = {}
        const parseInputValue = (value) => {
            if (typeof value !== 'string') {
                return value
            }
            // Remove escape characters (backslashes before special characters)
            // ex: \["a", "b", "c", "d", "e"\]
            let cleanedValue = value
                .replace(/\\"/g, '"') // \" -> "
                .replace(/\\\[/g, '[') // \[ -> [
                .replace(/\\\]/g, ']') // \] -> ]
                .replace(/\\\{/g, '{') // \{ -> {
                .replace(/\\\}/g, '}') // \} -> }
                .replace(/\\\\/g, '\\') // \\ -> \ (unescape backslash last)
            // Try to parse as JSON if it looks like JSON/array
            if (
                (cleanedValue.startsWith('[') && cleanedValue.endsWith(']')) ||
                (cleanedValue.startsWith('{') && cleanedValue.endsWith('}'))
            ) {
                try {
                    return JSON.parse(cleanedValue)
                } catch (e) {
                    // If parsing fails, return the cleaned value
                    return cleanedValue
                }
            }
            return cleanedValue
        }
        if (newToolNodeInstance.transformNodeInputsToToolArgs) {
            const defaultParams = newToolNodeInstance.transformNodeInputsToToolArgs(newNodeData)
            toolCallArgs = {
                ...defaultParams,
                ...toolCallArgs
            }
        }
        for (const item of toolInputArgs) {
            const variableName = item.inputArgName
            const variableValue = item.inputArgValue
            toolCallArgs[variableName] = parseInputValue(variableValue)
        }
        const flowConfig = {
            chatflowId: options.chatflowid,
            sessionId: options.sessionId,
            chatId: options.chatId,
            input: input,
            state: options.agentflowRuntime?.state
        }
        try {
            let toolOutput
            if (Array.isArray(toolInstance)) {
                // Execute all tools and combine their outputs
                const outputs = await Promise.all(
                    toolInstance.map((tool) =>
                        //@ts-ignore
                        tool.call(toolCallArgs, { signal: abortController?.signal }, undefined, flowConfig)
                    )
                )
                toolOutput = outputs.join('\n')
            } else {
                //@ts-ignore
                toolOutput = await toolInstance.call(toolCallArgs, { signal: abortController?.signal }, undefined, flowConfig)
            }
            let parsedArtifacts
            // Extract artifacts if present
            if (typeof toolOutput === 'string' && toolOutput.includes(agents_1.ARTIFACTS_PREFIX)) {
                const [output, artifact] = toolOutput.split(agents_1.ARTIFACTS_PREFIX)
                toolOutput = output
                try {
                    parsedArtifacts = JSON.parse(artifact)
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
            if (typeof toolOutput === 'object') {
                toolOutput = JSON.stringify(toolOutput, null, 2)
            }
            if (isStreamable) {
                const sseStreamer = options.sseStreamer
                sseStreamer.streamTokenEvent(chatId, toolOutput)
            }
            newState = (0, utils_2.processTemplateVariables)(newState, toolOutput)
            const returnOutput = {
                id: nodeData.id,
                name: this.name,
                input: {
                    toolInputArgs: toolInput ?? toolInputArgs,
                    selectedTool: selectedTool
                },
                output: {
                    content: toolOutput,
                    artifacts: parsedArtifacts
                },
                state: newState
            }
            return returnOutput
        } catch (e) {
            throw new Error(e)
        }
    }
}
module.exports = { nodeClass: Tool_Agentflow }
//# sourceMappingURL=Tool.js.map
