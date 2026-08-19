'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const prompts_1 = require('@langchain/core/prompts')
const defaultFunc = `const { AIMessage, HumanMessage, ToolMessage } = require('@langchain/core/messages');

return [
    new HumanMessage("What is 333382 🦜 1932?"),
    new AIMessage({
        content: "",
        tool_calls: [
        {
            id: "12345",
            name: "calculator",
            args: {
                number1: 333382,
                number2: 1932,
                operation: "divide",
            },
        },
        ],
    }),
    new ToolMessage({
        tool_call_id: "12345",
        content: "The answer is 172.558.",
    }),
    new AIMessage("The answer is 172.558."),
]`
const TAB_IDENTIFIER = 'selectedMessagesTab'
class ChatPromptTemplate_Prompts {
    constructor() {
        this.label = 'Chat Prompt Template'
        this.name = 'chatPromptTemplate'
        this.version = 2.0
        this.type = 'ChatPromptTemplate'
        this.icon = 'prompt.svg'
        this.category = 'Prompts'
        this.description = 'Schema to represent a chat prompt'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(prompts_1.ChatPromptTemplate)]
        this.inputs = [
            {
                label: 'System Message',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                placeholder: `You are a helpful assistant that translates {input_language} to {output_language}.`
            },
            {
                label: 'Human Message',
                name: 'humanMessagePrompt',
                description: 'This prompt will be added at the end of the messages as human message',
                type: 'string',
                rows: 4,
                placeholder: `{text}`
            },
            {
                label: 'Format Prompt Values',
                name: 'promptValues',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true
            },
            {
                label: 'Messages History',
                name: 'messageHistory',
                description: 'Add messages after System Message. This is useful when you want to provide few shot examples',
                type: 'tabs',
                tabIdentifier: TAB_IDENTIFIER,
                additionalParams: true,
                default: 'messageHistoryCode',
                tabs: [
                    //TODO: add UI for messageHistory
                    {
                        label: 'Add Messages (Code)',
                        name: 'messageHistoryCode',
                        type: 'code',
                        hideCodeExecute: true,
                        codeExample: defaultFunc,
                        optional: true,
                        additionalParams: true
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        let systemMessagePrompt = nodeData.inputs?.systemMessagePrompt
        let humanMessagePrompt = nodeData.inputs?.humanMessagePrompt
        const promptValuesStr = nodeData.inputs?.promptValues
        const tabIdentifier = nodeData.inputs?.[`${TAB_IDENTIFIER}_${nodeData.id}`]
        const selectedTab = tabIdentifier ? tabIdentifier.split(`_${nodeData.id}`)[0] : 'messageHistoryCode'
        const messageHistoryCode = nodeData.inputs?.messageHistoryCode
        const messageHistory = nodeData.inputs?.messageHistory
        systemMessagePrompt = (0, utils_1.transformBracesWithColon)(systemMessagePrompt)
        humanMessagePrompt = (0, utils_1.transformBracesWithColon)(humanMessagePrompt)
        let prompt = prompts_1.ChatPromptTemplate.fromMessages([
            prompts_1.SystemMessagePromptTemplate.fromTemplate(systemMessagePrompt),
            prompts_1.HumanMessagePromptTemplate.fromTemplate(humanMessagePrompt)
        ])
        if (
            (messageHistory && messageHistory === 'messageHistoryCode' && messageHistoryCode) ||
            (selectedTab === 'messageHistoryCode' && messageHistoryCode)
        ) {
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
                const response = await (0, utils_1.executeJavaScriptCode)(messageHistoryCode, sandbox, {
                    libraries: ['axios', '@langchain/core']
                })
                const parsedResponse = JSON.parse(response)
                if (!Array.isArray(parsedResponse)) {
                    throw new Error('Returned message history must be an array')
                }
                prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    prompts_1.SystemMessagePromptTemplate.fromTemplate(systemMessagePrompt),
                    ...parsedResponse,
                    prompts_1.HumanMessagePromptTemplate.fromTemplate(humanMessagePrompt)
                ])
            } catch (e) {
                throw new Error(e)
            }
        }
        let promptValues = {}
        if (promptValuesStr) {
            try {
                promptValues = typeof promptValuesStr === 'object' ? promptValuesStr : JSON.parse(promptValuesStr)
            } catch (exception) {
                throw new Error("Invalid JSON in the ChatPromptTemplate's promptValues: " + exception)
            }
        }
        // @ts-ignore
        prompt.promptValues = promptValues
        return prompt
    }
}
module.exports = { nodeClass: ChatPromptTemplate_Prompts }
//# sourceMappingURL=ChatPromptTemplate.js.map
