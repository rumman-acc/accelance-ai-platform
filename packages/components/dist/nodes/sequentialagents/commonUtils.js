'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.checkMessageHistory =
    exports.RunnableCallable =
    exports.ExtractTool =
    exports.restructureMessages =
    exports.convertStructuredSchemaToZod =
    exports.customGet =
    exports.processImageMessage =
    exports.transformObjectPropertyToFunction =
    exports.checkCondition =
        void 0
exports.filterConversationHistory = filterConversationHistory
const lodash_1 = require('lodash')
const v3_1 = require('zod/v3')
const tools_1 = require('@langchain/core/tools')
const mistralai_1 = require('@langchain/mistralai')
const anthropic_1 = require('@langchain/anthropic')
const runnables_1 = require('@langchain/core/runnables')
const messages_1 = require('@langchain/core/messages')
const multiModalUtils_1 = require('../../src/multiModalUtils')
const utils_1 = require('../../src/utils')
const prompts_1 = require('@langchain/core/prompts')
const checkCondition = (input, condition, value = '') => {
    if (!input && condition === 'Is Empty') return true
    else if (!input) return false
    // Function to check if a string is a valid number
    const isNumericString = (str) => /^-?\d*\.?\d+$/.test(str)
    // Function to convert input to number if possible
    const toNumber = (val) => {
        if (typeof val === 'number') return val
        return isNumericString(val) ? parseFloat(val) : NaN
    }
    // Convert input and value to numbers
    const numInput = toNumber(input)
    const numValue = toNumber(value)
    // Helper function for numeric comparisons
    const numericCompare = (comp) => {
        if (isNaN(numInput) || isNaN(numValue)) return false
        return comp(numInput, numValue)
    }
    // Helper function for string operations
    const stringCompare = (strInput, strValue, op) => {
        return op(String(strInput), String(strValue))
    }
    switch (condition) {
        // String conditions
        case 'Contains':
            return stringCompare(input, value, (a, b) => a.includes(b))
        case 'Not Contains':
            return stringCompare(input, value, (a, b) => !a.includes(b))
        case 'Start With':
            return stringCompare(input, value, (a, b) => a.startsWith(b))
        case 'End With':
            return stringCompare(input, value, (a, b) => a.endsWith(b))
        case 'Is':
            return String(input) === String(value)
        case 'Is Not':
            return String(input) !== String(value)
        case 'Is Empty':
            return String(input).trim().length === 0
        case 'Is Not Empty':
            return String(input).trim().length > 0
        // Numeric conditions
        case 'Greater Than':
            return numericCompare((a, b) => a > b)
        case 'Less Than':
            return numericCompare((a, b) => a < b)
        case 'Equal To':
            return numericCompare((a, b) => a === b)
        case 'Not Equal To':
            return numericCompare((a, b) => a !== b)
        case 'Greater Than or Equal To':
            return numericCompare((a, b) => a >= b)
        case 'Less Than or Equal To':
            return numericCompare((a, b) => a <= b)
        default:
            return false
    }
}
exports.checkCondition = checkCondition
const transformObjectPropertyToFunction = (obj, state) => {
    const transformedObject = {}
    for (const key in obj) {
        let value = obj[key]
        // get message from agent
        try {
            const parsedValue = JSON.parse(value)
            if (typeof parsedValue === 'object' && parsedValue.id) {
                const messageOutputs = (state.messages ?? []).filter(
                    (message) => message.additional_kwargs && message.additional_kwargs?.nodeId === parsedValue.id
                )
                const messageOutput = messageOutputs[messageOutputs.length - 1]
                if (messageOutput) {
                    // if messageOutput.content is a string, set value to the content
                    if (typeof messageOutput.content === 'string') value = messageOutput.content
                    // if messageOutput.content is an array
                    else if (Array.isArray(messageOutput.content)) {
                        if (messageOutput.content.length === 0) {
                            throw new Error(`Message output content is an empty array for node ${parsedValue.id}`)
                        }
                        // Get the first element of the array
                        const messageOutputContentFirstElement = messageOutput.content[0]
                        if (typeof messageOutputContentFirstElement === 'string') value = messageOutputContentFirstElement
                        // If messageOutputContentFirstElement is an object and has a text property, set value to the text property
                        else if (typeof messageOutputContentFirstElement === 'object' && messageOutputContentFirstElement.text)
                            value = messageOutputContentFirstElement.text
                        // Otherwise, stringify the messageOutputContentFirstElement
                        else value = JSON.stringify(messageOutputContentFirstElement)
                    }
                }
            }
        } catch (e) {
            // do nothing
        }
        // get state value
        if (value.startsWith('$flow.state')) {
            value = (0, exports.customGet)(state, value.replace('$flow.state.', ''))
            if (typeof value === 'object') value = JSON.stringify(value)
        }
        transformedObject[key] = () => value
    }
    return transformedObject
}
exports.transformObjectPropertyToFunction = transformObjectPropertyToFunction
const processImageMessage = async (llm, nodeData, options) => {
    let multiModalMessageContent = []
    if ((0, multiModalUtils_1.llmSupportsVision)(llm)) {
        multiModalMessageContent = await (0, multiModalUtils_1.addImagesToMessages)(nodeData, options, llm.multiModalOption)
    }
    return multiModalMessageContent
}
exports.processImageMessage = processImageMessage
const customGet = (obj, path) => {
    if (path.includes('[-1]')) {
        const parts = path.split('.')
        let result = obj
        for (let part of parts) {
            if (part.includes('[') && part.includes(']')) {
                const [name, indexPart] = part.split('[')
                const index = parseInt(indexPart.replace(']', ''))
                result = result[name]
                if (Array.isArray(result)) {
                    if (index < 0) {
                        result = result[result.length + index]
                    } else {
                        result = result[index]
                    }
                } else {
                    return undefined
                }
            } else {
                result = (0, lodash_1.get)(result, part)
            }
            if (result === undefined) {
                return undefined
            }
        }
        return result
    } else {
        return (0, lodash_1.get)(obj, path)
    }
}
exports.customGet = customGet
const convertStructuredSchemaToZod = (schema) => {
    try {
        const parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema
        const zodObj = {}
        for (const sch of parsedSchema) {
            if (sch.type === 'String') {
                zodObj[sch.key] = v3_1.z.string().describe(sch.description)
            } else if (sch.type === 'String Array') {
                zodObj[sch.key] = v3_1.z.array(v3_1.z.string()).describe(sch.description)
            } else if (sch.type === 'Number') {
                zodObj[sch.key] = v3_1.z.number().describe(sch.description)
            } else if (sch.type === 'Boolean') {
                zodObj[sch.key] = v3_1.z.boolean().describe(sch.description)
            } else if (sch.type === 'Enum') {
                zodObj[sch.key] = v3_1.z.enum(sch.enumValues.split(',').map((item) => item.trim())).describe(sch.description)
            }
        }
        return zodObj
    } catch (e) {
        throw new Error(e)
    }
}
exports.convertStructuredSchemaToZod = convertStructuredSchemaToZod
/**
 * Filter the conversation history based on the selected option.
 *
 * @param historySelection - The selected history option.
 * @param input - The user input.
 * @param state - The current state of the sequential llm or agent node.
 */
function filterConversationHistory(historySelection, input, state) {
    switch (historySelection) {
        case 'user_question':
            return [new messages_1.HumanMessage(input)]
        case 'last_message':
            // @ts-ignore
            return state.messages?.length ? [state.messages[state.messages.length - 1]] : []
        case 'empty':
            return []
        case 'all_messages':
            // @ts-ignore
            return state.messages ?? []
        default:
            throw new Error(`Unhandled conversationHistorySelection: ${historySelection}`)
    }
}
const restructureMessages = (llm, state) => {
    const messages = []
    for (const message of state.messages) {
        // Sometimes Anthropic can return a message with content types of array, ignore that EXCEPT when tool calls are present
        if (message.tool_calls?.length && message.content !== '') {
            message.content = JSON.stringify(message.content)
        }
        if (typeof message.content === 'string') {
            messages.push(message)
        }
    }
    const isToolMessage = (message) => message instanceof messages_1.ToolMessage || message.constructor.name === 'ToolMessageChunk'
    const isAIMessage = (message) => message instanceof messages_1.AIMessage || message.constructor.name === 'AIMessageChunk'
    const isHumanMessage = (message) => message instanceof messages_1.HumanMessage || message.constructor.name === 'HumanMessageChunk'
    /*
     * MistralAI does not support:
     * 1.) Last message as AI Message or Tool Message
     * 2.) Tool Message followed by Human Message
     */
    if (llm instanceof mistralai_1.ChatMistralAI) {
        if (messages.length > 1) {
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i]
                // If last message is denied Tool Message, add a new Human Message
                if (isToolMessage(message) && i === messages.length - 1 && message.additional_kwargs?.toolCallsDenied) {
                    messages.push(new messages_1.AIMessage({ content: `Tool calls got denied. Do you have other questions?` }))
                } else if (i + 1 < messages.length) {
                    const nextMessage = messages[i + 1]
                    const currentMessage = message
                    // If current message is Tool Message and next message is Human Message, add AI Message between Tool and Human Message
                    if (isToolMessage(currentMessage) && isHumanMessage(nextMessage)) {
                        messages.splice(i + 1, 0, new messages_1.AIMessage({ content: 'Tool calls executed' }))
                    }
                    // If last message is AI Message or Tool Message, add Human Message
                    if (i + 1 === messages.length - 1 && (isAIMessage(nextMessage) || isToolMessage(nextMessage))) {
                        messages.push(
                            new messages_1.HumanMessage({ content: nextMessage.content || 'Given the user question, answer user query' })
                        )
                    }
                }
            }
        }
    } else if (llm instanceof anthropic_1.ChatAnthropic) {
        /*
         * Anthropic does not support first message as AI Message
         */
        if (messages.length) {
            const firstMessage = messages[0]
            if (isAIMessage(firstMessage)) {
                messages.shift()
                messages.unshift(new messages_1.HumanMessage({ ...firstMessage }))
            }
        }
    }
    return messages
}
exports.restructureMessages = restructureMessages
class ExtractTool extends tools_1.StructuredTool {
    constructor(fields) {
        super()
        this.name = 'extract'
        this.description = 'Extract structured data from the output'
        this.schema = fields.schema
    }
    async _call(input) {
        return JSON.stringify(input)
    }
}
exports.ExtractTool = ExtractTool
class RunnableCallable extends runnables_1.Runnable {
    constructor(fields) {
        super()
        this.lc_namespace = ['langgraph']
        this.trace = true
        this.recurse = true
        this.name = fields.name ?? fields.func.name
        this.func = fields.func
        this.config = fields.tags ? { tags: fields.tags } : undefined
        this.trace = fields.trace ?? this.trace
        this.recurse = fields.recurse ?? this.recurse
        if (fields.metadata) {
            this.config = { ...this.config, metadata: { ...this.config, ...fields.metadata } }
        }
    }
    async invoke(input, options) {
        if (this.func === undefined) {
            return this.invoke(input, options)
        }
        let returnValue
        if (this.trace) {
            returnValue = await this._callWithConfig(this.func, input, (0, runnables_1.mergeConfigs)(this.config, options))
        } else {
            returnValue = await this.func(input, (0, runnables_1.mergeConfigs)(this.config, options))
        }
        if (returnValue instanceof runnables_1.Runnable && this.recurse) {
            return await returnValue.invoke(input, options)
        }
        return returnValue
    }
}
exports.RunnableCallable = RunnableCallable
const checkMessageHistory = async (nodeData, options, prompt, promptArrays, sysPrompt) => {
    const messageHistory = nodeData.inputs?.messageHistory
    if (messageHistory) {
        const appDataSource = options.appDataSource
        const databaseEntities = options.databaseEntities
        const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options)
        const flow = {
            chatflowId: options.chatflowid,
            sessionId: options.sessionId,
            chatId: options.chatId
        }
        const sandbox = (0, utils_1.createCodeExecutionSandbox)('', variables, flow)
        try {
            const response = await (0, utils_1.executeJavaScriptCode)(messageHistory, sandbox)
            if (!Array.isArray(response)) throw new Error('Returned message history must be an array')
            if (sysPrompt) {
                // insert at index 1
                promptArrays.splice(1, 0, ...response)
            } else {
                promptArrays.unshift(...response)
            }
            prompt = prompts_1.ChatPromptTemplate.fromMessages(promptArrays)
        } catch (e) {
            throw new Error(e)
        }
    }
    return prompt
}
exports.checkMessageHistory = checkMessageHistory
//# sourceMappingURL=commonUtils.js.map
