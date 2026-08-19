'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const runnables_1 = require('@langchain/core/runnables')
const prompts_1 = require('@langchain/core/prompts')
const messages_1 = require('@langchain/core/messages')
const openai_tools_1 = require('@langchain/classic/agents/format_scratchpad/openai_tools')
const agents_1 = require('../../../src/agents')
const utils_1 = require('../../../src/utils')
const commonUtils_1 = require('../commonUtils')
const langgraph_1 = require('@langchain/langgraph')
const defaultApprovalPrompt = `You are about to execute tool: {tools}. Ask if user want to proceed`
const examplePrompt = 'You are a research assistant who can search for up-to-date info using search engine.'
const customOutputFuncDesc = `This is only applicable when you have a custom State at the START node. After agent execution, you might want to update the State values`
const howToUseCode = `
1. Return the key value JSON object. For example: if you have the following State:
    \`\`\`json
    {
        "user": null
    }
    \`\`\`

    You can update the "user" value by returning the following:
    \`\`\`js
    return {
        "user": "john doe"
    }
    \`\`\`

2. If you want to use the agent's output as the value to update state, it is available as \`$flow.output\` with the following structure:
    \`\`\`json
    {
        "content": "Hello! How can I assist you today?",
        "usedTools": [
            {
                "tool": "tool-name",
                "toolInput": "{foo: var}",
                "toolOutput": "This is the tool's output"
            }
        ],
        "sourceDocuments": [
            {
                "pageContent": "This is the page content",
                "metadata": "{foo: var}"
            }
        ]
    }
    \`\`\`

    For example, if the \`toolOutput\` is the value you want to update the state with, you can return the following:
    \`\`\`js
    return {
        "user": $flow.output.usedTools[0].toolOutput
    }
    \`\`\`

3. You can also get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

4. You can get custom variables: \`$vars.<variable-name>\`

`
const howToUse = `
1. Key and value pair to be updated. For example: if you have the following State:
    | Key       | Operation     | Default Value     |
    |-----------|---------------|-------------------|
    | user      | Replace       |                   |

    You can update the "user" value with the following:
    | Key       | Value     |
    |-----------|-----------|
    | user      | john doe  |

2. If you want to use the Agent's output as the value to update state, it is available as available as \`$flow.output\` with the following structure:
    \`\`\`json
    {
        "content": "Hello! How can I assist you today?",
        "usedTools": [
            {
                "tool": "tool-name",
                "toolInput": "{foo: var}",
                "toolOutput": "This is the tool's output"
            }
        ],
        "sourceDocuments": [
            {
                "pageContent": "This is the page content",
                "metadata": "{foo: var}"
            }
        ]
    }
    \`\`\`

    For example, if the \`toolOutput\` is the value you want to update the state with, you can do the following:
    | Key       | Value                                     |
    |-----------|-------------------------------------------|
    | user      | \`$flow.output.usedTools[0].toolOutput\`  |

3. You can get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

4. You can get custom variables: \`$vars.<variable-name>\`

`
const defaultFunc = `const result = $flow.output;

/* Suppose we have a custom State schema like this:
* {
    aggregate: {
        value: (x, y) => x.concat(y),
        default: () => []
    }
  }
*/

return {
  aggregate: [result.content]
};`
const messageHistoryExample = `const { AIMessage, HumanMessage, ToolMessage } = require('@langchain/core/messages');

return [
    new HumanMessage("What is 333382 🦜 1932?"),
    new AIMessage({
        content: "",
        tool_calls: [
        {
            id: "12345",
            name: "calulator",
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
const TAB_IDENTIFIER = 'selectedUpdateStateMemoryTab'
class Agent_SeqAgents {
    constructor() {
        this.label = 'Agent'
        this.name = 'seqAgent'
        this.version = 4.1
        this.type = 'Agent'
        this.icon = 'seqAgent.png'
        this.category = 'Sequential Agents'
        this.description = 'Agent that can execute tools'
        this.baseClasses = [this.type]
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-4.-agent-node'
        this.inputs = [
            {
                label: 'Agent Name',
                name: 'agentName',
                type: 'string',
                placeholder: 'Agent'
            },
            {
                label: 'System Prompt',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                optional: true,
                default: examplePrompt
            },
            {
                label: 'Prepend Messages History',
                name: 'messageHistory',
                description:
                    'Prepend a list of messages between System Prompt and Human Prompt. This is useful when you want to provide few shot examples',
                type: 'code',
                hideCodeExecute: true,
                codeExample: messageHistoryExample,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Conversation History',
                name: 'conversationHistorySelection',
                type: 'options',
                options: [
                    {
                        label: 'User Question',
                        name: 'user_question',
                        description: 'Use the user question from the historical conversation messages as input.'
                    },
                    {
                        label: 'Last Conversation Message',
                        name: 'last_message',
                        description: 'Use the last conversation message from the historical conversation messages as input.'
                    },
                    {
                        label: 'All Conversation Messages',
                        name: 'all_messages',
                        description: 'Use all conversation messages from the historical conversation messages as input.'
                    },
                    {
                        label: 'Empty',
                        name: 'empty',
                        description:
                            'Do not use any messages from the conversation history. ' +
                            'Ensure to use either System Prompt, Human Prompt, or Messages History.'
                    }
                ],
                default: 'all_messages',
                optional: true,
                description:
                    'Select which messages from the conversation history to include in the prompt. ' +
                    'The selected messages will be inserted between the System Prompt (if defined) and ' +
                    '[Messages History, Human Prompt].',
                additionalParams: true
            },
            {
                label: 'Human Prompt',
                name: 'humanMessagePrompt',
                type: 'string',
                description: 'This prompt will be added at the end of the messages as human message',
                rows: 4,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Tools',
                name: 'tools',
                type: 'Tool',
                list: true,
                optional: true
            },
            {
                label: 'Sequential Node',
                name: 'sequentialNode',
                type: 'Start | Agent | Condition | LLMNode | ToolNode | CustomFunction | ExecuteFlow',
                description:
                    'Can be connected to one of the following nodes: Start, Agent, Condition, LLM Node, Tool Node, Custom Function, Execute Flow',
                list: true
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                optional: true,
                description: `Overwrite model to be used for this agent`
            },
            {
                label: 'Require Approval',
                name: 'interrupt',
                description:
                    'Pause execution and request user approval before running tools.\n' +
                    'If enabled, the agent will prompt the user with customizable approve/reject options\n' +
                    'and will proceed only after approval. This requires a configured agent memory to manage\n' +
                    'the state and handle approval requests.\n' +
                    'If no tools are invoked, the agent proceeds without interruption.',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Format Prompt Values',
                name: 'promptValues',
                description: 'Assign values to the prompt variables. You can also use $flow.state.<variable-name> to get the state value',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true
            },
            {
                label: 'Approval Prompt',
                name: 'approvalPrompt',
                description: 'Prompt for approval. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: defaultApprovalPrompt,
                rows: 4,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Approve Button Text',
                name: 'approveButtonText',
                description: 'Text for approve button. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: 'Yes',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Reject Button Text',
                name: 'rejectButtonText',
                description: 'Text for reject button. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: 'No',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Update State',
                name: 'updateStateMemory',
                type: 'tabs',
                tabIdentifier: TAB_IDENTIFIER,
                additionalParams: true,
                default: 'updateStateMemoryUI',
                tabs: [
                    {
                        label: 'Update State (Table)',
                        name: 'updateStateMemoryUI',
                        type: 'datagrid',
                        hint: {
                            label: 'How to use',
                            value: howToUse
                        },
                        description: customOutputFuncDesc,
                        datagrid: [
                            {
                                field: 'key',
                                headerName: 'Key',
                                type: 'asyncSingleSelect',
                                loadMethod: 'loadStateKeys',
                                flex: 0.5,
                                editable: true
                            },
                            {
                                field: 'value',
                                headerName: 'Value',
                                type: 'freeSolo',
                                valueOptions: [
                                    {
                                        label: 'Agent Output (string)',
                                        value: '$flow.output.content'
                                    },
                                    {
                                        label: `Used Tools (array)`,
                                        value: '$flow.output.usedTools'
                                    },
                                    {
                                        label: `First Tool Output (string)`,
                                        value: '$flow.output.usedTools[0].toolOutput'
                                    },
                                    {
                                        label: 'Source Documents (array)',
                                        value: '$flow.output.sourceDocuments'
                                    },
                                    {
                                        label: `Global variable (string)`,
                                        value: '$vars.<variable-name>'
                                    },
                                    {
                                        label: 'Input Question (string)',
                                        value: '$flow.input'
                                    },
                                    {
                                        label: 'Session Id (string)',
                                        value: '$flow.sessionId'
                                    },
                                    {
                                        label: 'Chat Id (string)',
                                        value: '$flow.chatId'
                                    },
                                    {
                                        label: 'Chatflow Id (string)',
                                        value: '$flow.chatflowId'
                                    }
                                ],
                                editable: true,
                                flex: 1
                            }
                        ],
                        optional: true,
                        additionalParams: true
                    },
                    {
                        label: 'Update State (Code)',
                        name: 'updateStateMemoryCode',
                        type: 'code',
                        hint: {
                            label: 'How to use',
                            value: howToUseCode
                        },
                        description: `${customOutputFuncDesc}. Must return an object representing the state`,
                        hideCodeExecute: true,
                        codeExample: defaultFunc,
                        optional: true,
                        additionalParams: true
                    }
                ]
            },
            {
                label: 'Max Iterations',
                name: 'maxIterations',
                type: 'number',
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData, input, options) {
        let tools = nodeData.inputs?.tools
        tools = (0, lodash_1.flatten)(tools)
        let agentSystemPrompt = nodeData.inputs?.systemMessagePrompt
        agentSystemPrompt = (0, utils_1.transformBracesWithColon)(agentSystemPrompt)
        let agentHumanPrompt = nodeData.inputs?.humanMessagePrompt
        agentHumanPrompt = (0, utils_1.transformBracesWithColon)(agentHumanPrompt)
        const agentLabel = nodeData.inputs?.agentName
        const sequentialNodes = nodeData.inputs?.sequentialNode
        const maxIterations = nodeData.inputs?.maxIterations
        const model = nodeData.inputs?.model
        const promptValuesStr = nodeData.inputs?.promptValues
        const output = nodeData.outputs?.output
        const approvalPrompt = nodeData.inputs?.approvalPrompt
        if (!agentLabel) throw new Error('Agent name is required!')
        const agentName = agentLabel.toLowerCase().replace(/\s/g, '_').trim()
        if (!sequentialNodes || !sequentialNodes.length) throw new Error('Agent must have a predecessor!')
        let agentInputVariablesValues = {}
        if (promptValuesStr) {
            try {
                agentInputVariablesValues = typeof promptValuesStr === 'object' ? promptValuesStr : JSON.parse(promptValuesStr)
            } catch (exception) {
                throw new Error("Invalid JSON in the Agent's Prompt Input Values: " + exception)
            }
        }
        agentInputVariablesValues = (0, utils_1.handleEscapeCharacters)(agentInputVariablesValues, true)
        const startLLM = sequentialNodes[0].startLLM
        const llm = model || startLLM
        if (nodeData.inputs) nodeData.inputs.model = llm
        const multiModalMessageContent =
            sequentialNodes[0]?.multiModalMessageContent || (await (0, commonUtils_1.processImageMessage)(llm, nodeData, options))
        const abortControllerSignal = options.signal
        const agentInputVariables = (0, lodash_1.uniq)([
            ...(0, utils_1.getInputVariables)(agentSystemPrompt),
            ...(0, utils_1.getInputVariables)(agentHumanPrompt)
        ])
        if (!agentInputVariables.every((element) => Object.keys(agentInputVariablesValues).includes(element))) {
            throw new Error('Agent input variables values are not provided!')
        }
        const interrupt = nodeData.inputs?.interrupt
        const toolName = `tool_${nodeData.id}`
        const toolNode = new ToolNode(tools, nodeData, input, options, toolName, [], { sequentialNodeName: toolName })
        toolNode.seekPermissionMessage = async (usedTools) => {
            const prompt = prompts_1.ChatPromptTemplate.fromMessages([['human', approvalPrompt || defaultApprovalPrompt]])
            const chain = prompt.pipe(startLLM)
            const response = await chain.invoke({
                input: 'Hello there!',
                tools: JSON.stringify(usedTools)
            })
            return response.content
        }
        const workerNode = async (state, config) => {
            return await agentNode(
                {
                    state,
                    llm,
                    interrupt,
                    agent: await createAgent(
                        nodeData,
                        options,
                        agentName,
                        state,
                        llm,
                        interrupt,
                        [...tools],
                        agentSystemPrompt,
                        agentHumanPrompt,
                        multiModalMessageContent,
                        agentInputVariablesValues,
                        maxIterations,
                        {
                            sessionId: options.sessionId,
                            chatId: options.chatId,
                            input
                        }
                    ),
                    name: agentName,
                    abortControllerSignal,
                    nodeData,
                    input,
                    options
                },
                config
            )
        }
        const toolInterrupt = async (graph, nextNodeName, runCondition, conditionalMapping = {}) => {
            const routeMessage = async (state) => {
                const messages = state.messages
                const lastMessage = messages[messages.length - 1]
                if (!lastMessage?.tool_calls?.length) {
                    // if next node is condition node, run the condition
                    if (runCondition) {
                        const returnNodeName = await runCondition(state)
                        return returnNodeName
                    }
                    return nextNodeName || langgraph_1.END
                }
                return toolName
            }
            graph.addNode(toolName, toolNode)
            if (nextNodeName) {
                // @ts-ignore
                graph.addConditionalEdges(agentName, routeMessage, {
                    [toolName]: toolName,
                    [langgraph_1.END]: langgraph_1.END,
                    [nextNodeName]: nextNodeName,
                    ...conditionalMapping
                })
            } else {
                // @ts-ignore
                graph.addConditionalEdges(agentName, routeMessage, {
                    [toolName]: toolName,
                    [langgraph_1.END]: langgraph_1.END,
                    ...conditionalMapping
                })
            }
            // @ts-ignore
            graph.addEdge(toolName, agentName)
            return graph
        }
        const returnOutput = {
            id: nodeData.id,
            node: workerNode,
            name: agentName,
            label: agentLabel,
            type: 'agent',
            llm,
            startLLM,
            output,
            predecessorAgents: sequentialNodes,
            multiModalMessageContent,
            moderations: sequentialNodes[0]?.moderations,
            agentInterruptToolNode: interrupt ? toolNode : undefined,
            agentInterruptToolFunc: interrupt ? toolInterrupt : undefined
        }
        return returnOutput
    }
}
async function createAgent(
    nodeData,
    options,
    agentName,
    state,
    llm,
    interrupt,
    tools,
    systemPrompt,
    humanPrompt,
    multiModalMessageContent,
    agentInputVariablesValues,
    maxIterations,
    flowObj
) {
    if (tools.length && !interrupt) {
        const promptArrays = [new prompts_1.MessagesPlaceholder('messages'), new prompts_1.MessagesPlaceholder('agent_scratchpad')]
        if (systemPrompt) promptArrays.unshift(['system', systemPrompt])
        if (humanPrompt) promptArrays.push(['human', humanPrompt])
        let prompt = prompts_1.ChatPromptTemplate.fromMessages(promptArrays)
        prompt = await (0, commonUtils_1.checkMessageHistory)(nodeData, options, prompt, promptArrays, systemPrompt)
        if (multiModalMessageContent.length) {
            const msg = prompts_1.HumanMessagePromptTemplate.fromTemplate([...multiModalMessageContent])
            prompt.promptMessages.splice(1, 0, msg)
        }
        if (llm.bindTools === undefined) {
            throw new Error(`This agent only compatible with function calling models.`)
        }
        const modelWithTools = llm.bindTools(tools)
        let agent
        if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
            agent = runnables_1.RunnableSequence.from([
                runnables_1.RunnablePassthrough.assign({
                    //@ts-ignore
                    agent_scratchpad: (input) => (0, openai_tools_1.formatToOpenAIToolMessages)(input.steps)
                }),
                prompt,
                modelWithTools,
                new agents_1.ToolCallingAgentOutputParser()
            ]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        } else {
            agent = runnables_1.RunnableSequence.from([
                runnables_1.RunnablePassthrough.assign({
                    //@ts-ignore
                    agent_scratchpad: (input) => (0, openai_tools_1.formatToOpenAIToolMessages)(input.steps)
                }),
                runnables_1.RunnablePassthrough.assign(
                    (0, commonUtils_1.transformObjectPropertyToFunction)(agentInputVariablesValues, state)
                ),
                prompt,
                modelWithTools,
                new agents_1.ToolCallingAgentOutputParser()
            ]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        }
        const executor = agents_1.AgentExecutor.fromAgentAndTools({
            agent,
            tools,
            sessionId: flowObj?.sessionId,
            chatId: flowObj?.chatId,
            input: flowObj?.input,
            verbose: process.env.DEBUG === 'true' ? true : false,
            maxIterations: maxIterations ? parseFloat(maxIterations) : undefined
        })
        return executor
    } else if (tools.length && interrupt) {
        if (llm.bindTools === undefined) {
            throw new Error(`Agent Node only compatible with function calling models.`)
        }
        // @ts-ignore
        llm = llm.bindTools(tools)
        const promptArrays = [new prompts_1.MessagesPlaceholder('messages')]
        if (systemPrompt) promptArrays.unshift(['system', systemPrompt])
        if (humanPrompt) promptArrays.push(['human', humanPrompt])
        let prompt = prompts_1.ChatPromptTemplate.fromMessages(promptArrays)
        prompt = await (0, commonUtils_1.checkMessageHistory)(nodeData, options, prompt, promptArrays, systemPrompt)
        if (multiModalMessageContent.length) {
            const msg = prompts_1.HumanMessagePromptTemplate.fromTemplate([...multiModalMessageContent])
            prompt.promptMessages.splice(1, 0, msg)
        }
        let agent
        if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
            agent = runnables_1.RunnableSequence.from([prompt, llm]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        } else {
            agent = runnables_1.RunnableSequence.from([
                runnables_1.RunnablePassthrough.assign(
                    (0, commonUtils_1.transformObjectPropertyToFunction)(agentInputVariablesValues, state)
                ),
                prompt,
                llm
            ]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        }
        return agent
    } else {
        const promptArrays = [new prompts_1.MessagesPlaceholder('messages')]
        if (systemPrompt) promptArrays.unshift(['system', systemPrompt])
        if (humanPrompt) promptArrays.push(['human', humanPrompt])
        let prompt = prompts_1.ChatPromptTemplate.fromMessages(promptArrays)
        prompt = await (0, commonUtils_1.checkMessageHistory)(nodeData, options, prompt, promptArrays, systemPrompt)
        if (multiModalMessageContent.length) {
            const msg = prompts_1.HumanMessagePromptTemplate.fromTemplate([...multiModalMessageContent])
            prompt.promptMessages.splice(1, 0, msg)
        }
        let conversationChain
        if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
            conversationChain = runnables_1.RunnableSequence.from([prompt, llm, (0, utils_1.createTextOnlyOutputParser)()]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        } else {
            conversationChain = runnables_1.RunnableSequence.from([
                runnables_1.RunnablePassthrough.assign(
                    (0, commonUtils_1.transformObjectPropertyToFunction)(agentInputVariablesValues, state)
                ),
                prompt,
                llm,
                (0, utils_1.createTextOnlyOutputParser)()
            ]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        }
        return conversationChain
    }
}
async function agentNode({ state, llm, interrupt, agent, name, abortControllerSignal, nodeData, input, options }, config) {
    try {
        if (abortControllerSignal.signal.aborted) {
            throw new Error('Aborted!')
        }
        const historySelection = nodeData.inputs?.conversationHistorySelection || 'all_messages'
        // @ts-ignore
        state.messages = (0, commonUtils_1.filterConversationHistory)(historySelection, input, state)
        // @ts-ignore
        state.messages = (0, commonUtils_1.restructureMessages)(llm, state)
        let result = await agent.invoke({ ...state, signal: abortControllerSignal.signal }, config)
        if (interrupt) {
            const messages = state.messages
            const lastMessage = messages.length ? messages[messages.length - 1] : null
            // If the last message is a tool message and is an interrupted message, format output into standard agent output
            if (lastMessage && lastMessage._getType() === 'tool' && lastMessage.additional_kwargs?.nodeId === nodeData.id) {
                let formattedAgentResult = {}
                formattedAgentResult.output = result.content
                if (lastMessage.additional_kwargs?.usedTools) {
                    formattedAgentResult.usedTools = lastMessage.additional_kwargs.usedTools
                }
                if (lastMessage.additional_kwargs?.sourceDocuments) {
                    formattedAgentResult.sourceDocuments = lastMessage.additional_kwargs.sourceDocuments
                }
                if (lastMessage.additional_kwargs?.artifacts) {
                    formattedAgentResult.artifacts = lastMessage.additional_kwargs.artifacts
                }
                result = formattedAgentResult
            } else {
                result.name = name
                result.additional_kwargs = { ...result.additional_kwargs, nodeId: nodeData.id, interrupt: true }
                return {
                    messages: [result]
                }
            }
        }
        const additional_kwargs = { nodeId: nodeData.id }
        if (result.usedTools) {
            additional_kwargs.usedTools = result.usedTools
        }
        if (result.sourceDocuments) {
            additional_kwargs.sourceDocuments = result.sourceDocuments
        }
        if (result.artifacts) {
            additional_kwargs.artifacts = result.artifacts
        }
        if (result.output) {
            result.content = result.output
            delete result.output
        }
        let outputContent = typeof result === 'string' ? result : result.content || result.output
        outputContent = (0, utils_1.extractOutputFromArray)(outputContent)
        outputContent = (0, utils_1.removeInvalidImageMarkdown)(outputContent)
        if (nodeData.inputs?.updateStateMemoryUI || nodeData.inputs?.updateStateMemoryCode) {
            let formattedOutput = {
                ...result,
                content: outputContent
            }
            const returnedOutput = await getReturnOutput(nodeData, input, options, formattedOutput, state)
            return {
                ...returnedOutput,
                messages: convertCustomMessagesToBaseMessages([outputContent], name, additional_kwargs)
            }
        } else {
            return {
                messages: [
                    new messages_1.HumanMessage({
                        content: outputContent,
                        name,
                        additional_kwargs: Object.keys(additional_kwargs).length ? additional_kwargs : undefined
                    })
                ]
            }
        }
    } catch (error) {
        throw new Error(error)
    }
}
const getReturnOutput = async (nodeData, input, options, output, state) => {
    const appDataSource = options.appDataSource
    const databaseEntities = options.databaseEntities
    const tabIdentifier = nodeData.inputs?.[`${TAB_IDENTIFIER}_${nodeData.id}`]
    const updateStateMemoryUI = nodeData.inputs?.updateStateMemoryUI
    const updateStateMemoryCode = nodeData.inputs?.updateStateMemoryCode
    const updateStateMemory = nodeData.inputs?.updateStateMemory
    const selectedTab = tabIdentifier ? tabIdentifier.split(`_${nodeData.id}`)[0] : 'updateStateMemoryUI'
    const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options)
    const flow = {
        chatflowId: options.chatflowid,
        sessionId: options.sessionId,
        chatId: options.chatId,
        input,
        output,
        state,
        vars: (0, utils_1.prepareSandboxVars)(variables)
    }
    if (updateStateMemory && updateStateMemory !== 'updateStateMemoryUI' && updateStateMemory !== 'updateStateMemoryCode') {
        try {
            const parsedSchema = typeof updateStateMemory === 'string' ? JSON.parse(updateStateMemory) : updateStateMemory
            const obj = {}
            for (const sch of parsedSchema) {
                const key = sch.Key
                if (!key) throw new Error(`Key is required`)
                let value = sch.Value
                if (value.startsWith('$flow')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.Value.replace('$flow.', ''))
                } else if (value.startsWith('$vars')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.Value.replace('$', ''))
                }
                obj[key] = value
            }
            return obj
        } catch (e) {
            throw new Error(e)
        }
    }
    if (selectedTab === 'updateStateMemoryUI' && updateStateMemoryUI) {
        try {
            const parsedSchema = typeof updateStateMemoryUI === 'string' ? JSON.parse(updateStateMemoryUI) : updateStateMemoryUI
            const obj = {}
            for (const sch of parsedSchema) {
                const key = sch.key
                if (!key) throw new Error(`Key is required`)
                let value = sch.value
                if (value.startsWith('$flow')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.value.replace('$flow.', ''))
                } else if (value.startsWith('$vars')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.value.replace('$', ''))
                }
                obj[key] = value
            }
            return obj
        } catch (e) {
            throw new Error(e)
        }
    } else if (selectedTab === 'updateStateMemoryCode' && updateStateMemoryCode) {
        const sandbox = (0, utils_1.createCodeExecutionSandbox)(input, variables, flow)
        try {
            const response = await (0, utils_1.executeJavaScriptCode)(updateStateMemoryCode, sandbox)
            if (typeof response !== 'object') throw new Error('Return output must be an object')
            return response
        } catch (e) {
            throw new Error(e)
        }
    }
    return {}
}
const convertCustomMessagesToBaseMessages = (messages, name, additional_kwargs) => {
    return messages.map((message) => {
        return new messages_1.HumanMessage({
            content: message,
            name,
            additional_kwargs: Object.keys(additional_kwargs).length ? additional_kwargs : undefined
        })
    })
}
class ToolNode extends commonUtils_1.RunnableCallable {
    constructor(tools, nodeData, inputQuery, options, name = 'tools', tags = [], metadata = {}) {
        super({ name, metadata, tags, func: (input, config) => this.run(input, config) })
        this.tools = tools
        this.nodeData = nodeData
        this.inputQuery = inputQuery
        this.options = options
    }
    async run(input, config) {
        let messages
        // Check if input is an array of BaseMessage[]
        if (Array.isArray(input)) {
            messages = input
        }
        // Check if input is IStateWithMessages
        else if (input.messages) {
            messages = input.messages
        }
        // Handle MessagesState type
        else {
            messages = input.messages
        }
        // Get the last message
        const message = messages[messages.length - 1]
        if (message._getType() !== 'ai') {
            throw new Error('ToolNode only accepts AIMessages as input.')
        }
        // Extract all properties except messages for IStateWithMessages
        const { messages: _, ...inputWithoutMessages } = Array.isArray(input) ? { messages: input } : input
        const ChannelsWithoutMessages = {
            chatId: this.options.chatId,
            sessionId: this.options.sessionId,
            input: this.inputQuery,
            state: inputWithoutMessages
        }
        const outputs = await Promise.all(
            message.tool_calls?.map(async (call) => {
                const tool = this.tools.find((tool) => tool.name === call.name)
                if (tool === undefined) {
                    throw new Error(`Tool ${call.name} not found.`)
                }
                if (tool && tool.setFlowObject) {
                    // @ts-ignore
                    tool.setFlowObject(ChannelsWithoutMessages)
                }
                let output = await tool.invoke(call.args, config)
                let sourceDocuments = []
                let artifacts = []
                if (output?.includes(agents_1.SOURCE_DOCUMENTS_PREFIX)) {
                    const outputArray = output.split(agents_1.SOURCE_DOCUMENTS_PREFIX)
                    output = outputArray[0]
                    const docs = outputArray[1]
                    try {
                        sourceDocuments = JSON.parse(docs)
                    } catch (e) {
                        console.error('Error parsing source documents from tool')
                    }
                }
                if (output?.includes(agents_1.ARTIFACTS_PREFIX)) {
                    const outputArray = output.split(agents_1.ARTIFACTS_PREFIX)
                    output = outputArray[0]
                    try {
                        artifacts = JSON.parse(outputArray[1])
                    } catch (e) {
                        console.error('Error parsing artifacts from tool')
                    }
                }
                let toolInput
                if (typeof output === 'string' && output.includes(agents_1.TOOL_ARGS_PREFIX)) {
                    const outputArray = output.split(agents_1.TOOL_ARGS_PREFIX)
                    output = outputArray[0]
                    try {
                        toolInput = JSON.parse(outputArray[1])
                    } catch (e) {
                        console.error('Error parsing tool input from tool')
                    }
                }
                return new messages_1.ToolMessage({
                    name: tool.name,
                    content: typeof output === 'string' ? output : JSON.stringify(output),
                    tool_call_id: call.id,
                    additional_kwargs: {
                        sourceDocuments,
                        artifacts,
                        args: toolInput ?? call.args,
                        usedTools: [
                            {
                                tool: tool.name ?? '',
                                toolInput: toolInput ?? call.args,
                                toolOutput: output
                            }
                        ]
                    }
                })
            }) ?? []
        )
        const additional_kwargs = { nodeId: this.nodeData.id }
        outputs.forEach((result) => (result.additional_kwargs = { ...result.additional_kwargs, ...additional_kwargs }))
        return Array.isArray(input) ? outputs : { messages: outputs }
    }
}
module.exports = { nodeClass: Agent_SeqAgents }
//# sourceMappingURL=Agent.js.map
