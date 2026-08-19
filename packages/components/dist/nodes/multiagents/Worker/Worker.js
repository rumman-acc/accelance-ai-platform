'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const runnables_1 = require('@langchain/core/runnables')
const prompts_1 = require('@langchain/core/prompts')
const messages_1 = require('@langchain/core/messages')
const openai_tools_1 = require('@langchain/classic/agents/format_scratchpad/openai_tools')
const agents_1 = require('../../../src/agents')
const utils_1 = require('../../../src/utils')
const examplePrompt = 'You are a research assistant who can search for up-to-date info using search engine.'
class Worker_MultiAgents {
    constructor() {
        this.label = 'Worker'
        this.name = 'worker'
        this.version = 2.0
        this.type = 'Worker'
        this.icon = 'worker.svg'
        this.category = 'Multi Agents'
        this.baseClasses = [this.type]
        this.hideOutput = true
        this.inputs = [
            {
                label: 'Worker Name',
                name: 'workerName',
                type: 'string',
                placeholder: 'Worker'
            },
            {
                label: 'Worker Prompt',
                name: 'workerPrompt',
                type: 'string',
                rows: 4,
                default: examplePrompt
            },
            {
                label: 'Tools',
                name: 'tools',
                type: 'Tool',
                list: true,
                optional: true
            },
            {
                label: 'Supervisor',
                name: 'supervisor',
                type: 'Supervisor'
            },
            {
                label: 'Tool Calling Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                optional: true,
                description: `Only compatible with models that are capable of function calling: ChatOpenAI, ChatMistral, ChatAnthropic, ChatGoogleGenerativeAI, ChatVertexAI, GroqChat. If not specified, supervisor's model will be used`
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
                label: 'Max Iterations',
                name: 'maxIterations',
                type: 'number',
                optional: true
            }
        ]
    }
    async init(nodeData, input, options) {
        let tools = nodeData.inputs?.tools
        tools = (0, lodash_1.flatten)(tools)
        let workerPrompt = nodeData.inputs?.workerPrompt
        const workerLabel = nodeData.inputs?.workerName
        const supervisor = nodeData.inputs?.supervisor
        const maxIterations = nodeData.inputs?.maxIterations
        const model = nodeData.inputs?.model
        const promptValuesStr = nodeData.inputs?.promptValues
        if (!workerLabel) throw new Error('Worker name is required!')
        const workerName = workerLabel.toLowerCase().replace(/\s/g, '_').trim()
        if (!workerPrompt) throw new Error('Worker prompt is required!')
        let workerInputVariablesValues = {}
        if (promptValuesStr) {
            try {
                workerInputVariablesValues = typeof promptValuesStr === 'object' ? promptValuesStr : JSON.parse(promptValuesStr)
            } catch (exception) {
                throw new Error("Invalid JSON in the Worker's Prompt Input Values: " + exception)
            }
        }
        workerInputVariablesValues = (0, utils_1.handleEscapeCharacters)(workerInputVariablesValues, true)
        const llm = model || supervisor.llm
        const multiModalMessageContent = supervisor?.multiModalMessageContent || []
        const abortControllerSignal = options.signal
        const workerInputVariables = (0, utils_1.getInputVariables)(workerPrompt)
        if (!workerInputVariables.every((element) => Object.keys(workerInputVariablesValues).includes(element))) {
            throw new Error('Worker input variables values are not provided!')
        }
        const agent = await createAgent(
            llm,
            [...tools],
            workerPrompt,
            multiModalMessageContent,
            workerInputVariablesValues,
            maxIterations,
            {
                sessionId: options.sessionId,
                chatId: options.chatId,
                input
            }
        )
        const workerNode = async (state, config) =>
            await agentNode(
                {
                    state,
                    agent: agent,
                    name: workerName,
                    nodeId: nodeData.id,
                    abortControllerSignal
                },
                config
            )
        const returnOutput = {
            node: workerNode,
            name: workerName,
            label: workerLabel,
            type: 'worker',
            workerPrompt,
            workerInputVariables,
            parentSupervisorName: supervisor.name ?? 'supervisor'
        }
        return returnOutput
    }
}
async function createAgent(llm, tools, systemPrompt, multiModalMessageContent, workerInputVariablesValues, maxIterations, flowObj) {
    if (tools.length) {
        const combinedPrompt =
            systemPrompt +
            '\nWork autonomously according to your specialty, using the tools available to you.' +
            ' Do not ask for clarification.' +
            ' Your other team members (and other teams) will collaborate with you with their own specialties.' +
            ' You are chosen for a reason! You are one of the following team members: {team_members}.'
        //const toolNames = tools.length ? tools.map((t) => t.name).join(', ') : ''
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ['system', combinedPrompt],
            new prompts_1.MessagesPlaceholder('messages'),
            new prompts_1.MessagesPlaceholder('agent_scratchpad')
            /* Gettind rid of this for now because other LLMs dont support system message at later stage
            [
                'system',
                [
                    'Supervisor instructions: {instructions}\n' + tools.length
                        ? `Remember, you individually can only use these tools: ${toolNames}`
                        : '' + '\n\nEnd if you have already completed the requested task. Communicate the work completed.'
                ].join('\n')
            ]*/
        ])
        if (multiModalMessageContent.length) {
            const msg = prompts_1.HumanMessagePromptTemplate.fromTemplate([...multiModalMessageContent])
            prompt.promptMessages.splice(1, 0, msg)
        }
        if (llm.bindTools === undefined) {
            throw new Error(`This agent only compatible with function calling models.`)
        }
        const modelWithTools = llm.bindTools(tools)
        let agent
        if (!workerInputVariablesValues || !Object.keys(workerInputVariablesValues).length) {
            agent = runnables_1.RunnableSequence.from([
                runnables_1.RunnablePassthrough.assign({
                    //@ts-ignore
                    agent_scratchpad: (input) => (0, openai_tools_1.formatToOpenAIToolMessages)(input.steps)
                }),
                prompt,
                modelWithTools,
                new agents_1.ToolCallingAgentOutputParser()
            ])
        } else {
            agent = runnables_1.RunnableSequence.from([
                runnables_1.RunnablePassthrough.assign({
                    //@ts-ignore
                    agent_scratchpad: (input) => (0, openai_tools_1.formatToOpenAIToolMessages)(input.steps)
                }),
                runnables_1.RunnablePassthrough.assign(transformObjectPropertyToFunction(workerInputVariablesValues)),
                prompt,
                modelWithTools,
                new agents_1.ToolCallingAgentOutputParser()
            ])
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
    } else {
        const combinedPrompt =
            systemPrompt +
            '\nWork autonomously according to your specialty, using the tools available to you.' +
            ' Do not ask for clarification.' +
            ' Your other team members (and other teams) will collaborate with you with their own specialties.' +
            ' You are chosen for a reason! You are one of the following team members: {team_members}.'
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ['system', combinedPrompt],
            new prompts_1.MessagesPlaceholder('messages')
        ])
        if (multiModalMessageContent.length) {
            const msg = prompts_1.HumanMessagePromptTemplate.fromTemplate([...multiModalMessageContent])
            prompt.promptMessages.splice(1, 0, msg)
        }
        let conversationChain
        if (!workerInputVariablesValues || !Object.keys(workerInputVariablesValues).length) {
            conversationChain = runnables_1.RunnableSequence.from([prompt, llm, (0, utils_1.createTextOnlyOutputParser)()])
        } else {
            conversationChain = runnables_1.RunnableSequence.from([
                runnables_1.RunnablePassthrough.assign(transformObjectPropertyToFunction(workerInputVariablesValues)),
                prompt,
                llm,
                (0, utils_1.createTextOnlyOutputParser)()
            ])
        }
        return conversationChain
    }
}
async function agentNode({ state, agent, name, nodeId, abortControllerSignal }, config) {
    try {
        if (abortControllerSignal.signal.aborted) {
            throw new Error('Aborted!')
        }
        const result = await agent.invoke({ ...state, signal: abortControllerSignal.signal }, config)
        const additional_kwargs = { nodeId, type: 'worker' }
        if (result.usedTools) {
            additional_kwargs.usedTools = result.usedTools
        }
        if (result.sourceDocuments) {
            additional_kwargs.sourceDocuments = result.sourceDocuments
        }
        return {
            messages: [
                new messages_1.HumanMessage({
                    content: typeof result === 'string' ? result : result.output,
                    name,
                    additional_kwargs: Object.keys(additional_kwargs).length ? additional_kwargs : undefined
                })
            ]
        }
    } catch (error) {
        throw new Error('Aborted!')
    }
}
const transformObjectPropertyToFunction = (obj) => {
    const transformedObject = {}
    for (const key in obj) {
        transformedObject[key] = () => obj[key]
    }
    return transformedObject
}
module.exports = { nodeClass: Worker_MultiAgents }
//# sourceMappingURL=Worker.js.map
