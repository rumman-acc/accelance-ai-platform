"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const v3_1 = require("zod/v3");
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
const messages_1 = require("@langchain/core/messages");
const utils_1 = require("../../../src/utils");
const commonUtils_1 = require("../commonUtils");
const TAB_IDENTIFIER = 'selectedUpdateStateMemoryTab';
const customOutputFuncDesc = `This is only applicable when you have a custom State at the START node. After agent execution, you might want to update the State values`;
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

2. If you want to use the LLM Node's output as the value to update state, it is available as \`$flow.output\` with the following structure:
    \`\`\`json
    {
        "content": 'Hello! How can I assist you today?',
        "name": "",
        "additional_kwargs": {},
        "response_metadata": {},
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {}
    }
    \`\`\`

    For example, if the output \`content\` is the value you want to update the state with, you can return the following:
    \`\`\`js
    return {
        "user": $flow.output.content
    }
    \`\`\`

3. You can also get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

4. You can get custom variables: \`$vars.<variable-name>\`

`;
const howToUse = `
1. Key and value pair to be updated. For example: if you have the following State:
    | Key       | Operation     | Default Value     |
    |-----------|---------------|-------------------|
    | user      | Replace       |                   |

    You can update the "user" value with the following:
    | Key       | Value     |
    |-----------|-----------|
    | user      | john doe  |

2. If you want to use the LLM Node's output as the value to update state, it is available as available as \`$flow.output\` with the following structure:
    \`\`\`json
    {
        "content": 'Hello! How can I assist you today?',
        "name": "",
        "additional_kwargs": {},
        "response_metadata": {},
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {}
    }
    \`\`\`

    For example, if the output \`content\` is the value you want to update the state with, you can do the following:
    | Key       | Value                     |
    |-----------|---------------------------|
    | user      | \`$flow.output.content\`  |

3. You can get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

4. You can get custom variables: \`$vars.<variable-name>\`

`;
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
};`;
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
]`;
class LLMNode_SeqAgents {
    constructor() {
        this.label = 'LLM Node';
        this.name = 'seqLLMNode';
        this.version = 4.1;
        this.type = 'LLMNode';
        this.icon = 'llmNode.svg';
        this.category = 'Sequential Agents';
        this.description = 'Run Chat Model and return the output';
        this.baseClasses = [this.type];
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-5.-llm-node';
        this.inputs = [
            {
                label: 'Name',
                name: 'llmNodeName',
                type: 'string',
                placeholder: 'LLM'
            },
            {
                label: 'System Prompt',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Prepend Messages History',
                name: 'messageHistory',
                description: 'Prepend a list of messages between System Prompt and Human Prompt. This is useful when you want to provide few shot examples',
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
                        description: 'Do not use any messages from the conversation history. ' +
                            'Ensure to use either System Prompt, Human Prompt, or Messages History.'
                    }
                ],
                default: 'all_messages',
                optional: true,
                description: 'Select which messages from the conversation history to include in the prompt. ' +
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
                label: 'Sequential Node',
                name: 'sequentialNode',
                type: 'Start | Agent | Condition | LLMNode | ToolNode | CustomFunction | ExecuteFlow',
                description: 'Can be connected to one of the following nodes: Start, Agent, Condition, LLM, Tool Node, Custom Function, Execute Flow',
                list: true
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                optional: true,
                description: `Overwrite model to be used for this node`
            },
            {
                label: 'Format Prompt Values',
                name: 'promptValues',
                description: 'Assign values to the prompt variables. You can also use $flow.state.<variable-name> to get the state value',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true,
                additionalParams: true
            },
            {
                label: 'JSON Structured Output',
                name: 'llmStructuredOutput',
                type: 'datagrid',
                description: 'Instruct the LLM to give output in a JSON structured schema',
                datagrid: [
                    { field: 'key', headerName: 'Key', editable: true },
                    {
                        field: 'type',
                        headerName: 'Type',
                        type: 'singleSelect',
                        valueOptions: ['String', 'String Array', 'Number', 'Boolean', 'Enum'],
                        editable: true
                    },
                    { field: 'enumValues', headerName: 'Enum Values', editable: true },
                    { field: 'description', headerName: 'Description', flex: 1, editable: true }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Update State',
                name: 'updateStateMemory',
                type: 'tabs',
                tabIdentifier: TAB_IDENTIFIER,
                default: 'updateStateMemoryUI',
                additionalParams: true,
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
                                        label: 'LLM Node Output (string)',
                                        value: '$flow.output.content'
                                    },
                                    {
                                        label: `LLM JSON Output Key (string)`,
                                        value: '$flow.output.<replace-with-key>'
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
            }
        ];
    }
    async init(nodeData, input, options) {
        // Tools can be connected through ToolNodes
        let tools = nodeData.inputs?.tools;
        tools = (0, lodash_1.flatten)(tools);
        let systemPrompt = nodeData.inputs?.systemMessagePrompt;
        systemPrompt = (0, utils_1.transformBracesWithColon)(systemPrompt);
        let humanPrompt = nodeData.inputs?.humanMessagePrompt;
        humanPrompt = (0, utils_1.transformBracesWithColon)(humanPrompt);
        const llmNodeLabel = nodeData.inputs?.llmNodeName;
        const sequentialNodes = nodeData.inputs?.sequentialNode;
        const model = nodeData.inputs?.model;
        const promptValuesStr = nodeData.inputs?.promptValues;
        const output = nodeData.outputs?.output;
        const llmStructuredOutput = nodeData.inputs?.llmStructuredOutput;
        if (!llmNodeLabel)
            throw new Error('LLM Node name is required!');
        const llmNodeName = llmNodeLabel.toLowerCase().replace(/\s/g, '_').trim();
        if (!sequentialNodes || !sequentialNodes.length)
            throw new Error('Agent must have a predecessor!');
        let llmNodeInputVariablesValues = {};
        if (promptValuesStr) {
            try {
                llmNodeInputVariablesValues = typeof promptValuesStr === 'object' ? promptValuesStr : JSON.parse(promptValuesStr);
            }
            catch (exception) {
                throw new Error("Invalid JSON in the LLM Node's Prompt Input Values: " + exception);
            }
        }
        llmNodeInputVariablesValues = (0, utils_1.handleEscapeCharacters)(llmNodeInputVariablesValues, true);
        const startLLM = sequentialNodes[0].startLLM;
        const llm = model || startLLM;
        if (nodeData.inputs)
            nodeData.inputs.model = llm;
        const multiModalMessageContent = sequentialNodes[0]?.multiModalMessageContent || (await (0, commonUtils_1.processImageMessage)(llm, nodeData, options));
        const abortControllerSignal = options.signal;
        const llmNodeInputVariables = (0, lodash_1.uniq)([...(0, utils_1.getInputVariables)(systemPrompt), ...(0, utils_1.getInputVariables)(humanPrompt)]);
        const missingInputVars = (0, lodash_1.difference)(llmNodeInputVariables, Object.keys(llmNodeInputVariablesValues)).join(' ');
        const allVariablesSatisfied = missingInputVars.length === 0;
        if (!allVariablesSatisfied) {
            const nodeInputVars = llmNodeInputVariables.join(' ');
            const providedInputVars = Object.keys(llmNodeInputVariablesValues).join(' ');
            throw new Error(`LLM Node input variables values are not provided! Required: ${nodeInputVars}, Provided: ${providedInputVars}. Missing: ${missingInputVars}`);
        }
        const workerNode = async (state, config) => {
            const bindModel = config.configurable?.bindModel?.[nodeData.id];
            return await agentNode({
                state,
                llm,
                agent: await createAgent(nodeData, options, llmNodeName, state, bindModel || llm, [...tools], systemPrompt, humanPrompt, multiModalMessageContent, llmNodeInputVariablesValues, llmStructuredOutput),
                name: llmNodeName,
                abortControllerSignal,
                nodeData,
                input,
                options
            }, config);
        };
        const returnOutput = {
            id: nodeData.id,
            node: workerNode,
            name: llmNodeName,
            label: llmNodeLabel,
            type: 'llm',
            llm,
            startLLM,
            output,
            predecessorAgents: sequentialNodes,
            multiModalMessageContent,
            moderations: sequentialNodes[0]?.moderations
        };
        return returnOutput;
    }
}
async function createAgent(nodeData, options, llmNodeName, state, llm, tools, systemPrompt, humanPrompt, multiModalMessageContent, llmNodeInputVariablesValues, llmStructuredOutput) {
    if (tools.length) {
        if (llm.bindTools === undefined) {
            throw new Error(`LLM Node only compatible with function calling models.`);
        }
        // @ts-ignore
        llm = llm.bindTools(tools);
    }
    if (llmStructuredOutput && llmStructuredOutput !== '[]') {
        try {
            const structuredOutput = v3_1.z.object((0, commonUtils_1.convertStructuredSchemaToZod)(llmStructuredOutput));
            // @ts-ignore
            llm = llm.withStructuredOutput(structuredOutput, {
                method: 'functionCalling'
            });
        }
        catch (exception) {
            console.error(exception);
        }
    }
    const promptArrays = [new prompts_1.MessagesPlaceholder('messages')];
    if (systemPrompt)
        promptArrays.unshift(['system', systemPrompt]);
    if (humanPrompt)
        promptArrays.push(['human', humanPrompt]);
    let prompt = prompts_1.ChatPromptTemplate.fromMessages(promptArrays);
    prompt = await (0, commonUtils_1.checkMessageHistory)(nodeData, options, prompt, promptArrays, systemPrompt);
    if (multiModalMessageContent.length) {
        const msg = prompts_1.HumanMessagePromptTemplate.fromTemplate([...multiModalMessageContent]);
        prompt.promptMessages.splice(1, 0, msg);
    }
    let chain;
    if (!llmNodeInputVariablesValues || !Object.keys(llmNodeInputVariablesValues).length) {
        chain = runnables_1.RunnableSequence.from([prompt, llm]).withConfig({
            metadata: { sequentialNodeName: llmNodeName }
        });
    }
    else {
        chain = runnables_1.RunnableSequence.from([
            runnables_1.RunnablePassthrough.assign((0, commonUtils_1.transformObjectPropertyToFunction)(llmNodeInputVariablesValues, state)),
            prompt,
            llm
        ]).withConfig({
            metadata: { sequentialNodeName: llmNodeName }
        });
    }
    // @ts-ignore
    return chain;
}
async function agentNode({ state, llm, agent, name, abortControllerSignal, nodeData, input, options }, config) {
    try {
        if (abortControllerSignal.signal.aborted) {
            throw new Error('Aborted!');
        }
        const historySelection = (nodeData.inputs?.conversationHistorySelection || 'all_messages');
        // @ts-ignore
        state.messages = (0, commonUtils_1.filterConversationHistory)(historySelection, input, state);
        // @ts-ignore
        state.messages = (0, commonUtils_1.restructureMessages)(llm, state);
        let result = await agent.invoke({ ...state, signal: abortControllerSignal.signal }, config);
        const llmStructuredOutput = nodeData.inputs?.llmStructuredOutput;
        if (llmStructuredOutput && llmStructuredOutput !== '[]' && result.tool_calls && result.tool_calls.length) {
            let jsonResult = {};
            for (const toolCall of result.tool_calls) {
                jsonResult = { ...jsonResult, ...toolCall.args };
            }
            result = { ...jsonResult, additional_kwargs: { nodeId: nodeData.id } };
        }
        if (nodeData.inputs?.updateStateMemoryUI || nodeData.inputs?.updateStateMemoryCode) {
            const returnedOutput = await getReturnOutput(nodeData, input, options, result, state);
            if (nodeData.inputs?.llmStructuredOutput && nodeData.inputs.llmStructuredOutput !== '[]') {
                const messages = [
                    new messages_1.AIMessage({
                        content: typeof result === 'object' ? JSON.stringify(result) : result,
                        name,
                        additional_kwargs: { nodeId: nodeData.id }
                    })
                ];
                return {
                    ...returnedOutput,
                    messages
                };
            }
            else {
                result.name = name;
                result.additional_kwargs = { ...result.additional_kwargs, nodeId: nodeData.id };
                let outputContent = typeof result === 'string' ? result : result.content;
                result.content = (0, utils_1.extractOutputFromArray)(outputContent);
                return {
                    ...returnedOutput,
                    messages: [result]
                };
            }
        }
        else {
            if (nodeData.inputs?.llmStructuredOutput && nodeData.inputs.llmStructuredOutput !== '[]') {
                const messages = [
                    new messages_1.AIMessage({
                        content: typeof result === 'object' ? JSON.stringify(result) : result,
                        name,
                        additional_kwargs: { nodeId: nodeData.id }
                    })
                ];
                return {
                    messages
                };
            }
            else {
                result.name = name;
                result.additional_kwargs = { ...result.additional_kwargs, nodeId: nodeData.id };
                let outputContent = typeof result === 'string' ? result : result.content;
                result.content = (0, utils_1.extractOutputFromArray)(outputContent);
                return {
                    messages: [result]
                };
            }
        }
    }
    catch (error) {
        throw new Error(error);
    }
}
const getReturnOutput = async (nodeData, input, options, output, state) => {
    const appDataSource = options.appDataSource;
    const databaseEntities = options.databaseEntities;
    const tabIdentifier = nodeData.inputs?.[`${TAB_IDENTIFIER}_${nodeData.id}`];
    const updateStateMemoryUI = nodeData.inputs?.updateStateMemoryUI;
    const updateStateMemoryCode = nodeData.inputs?.updateStateMemoryCode;
    const updateStateMemory = nodeData.inputs?.updateStateMemory;
    const selectedTab = tabIdentifier ? tabIdentifier.split(`_${nodeData.id}`)[0] : 'updateStateMemoryUI';
    const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options);
    const flow = {
        chatflowId: options.chatflowid,
        sessionId: options.sessionId,
        chatId: options.chatId,
        input,
        output,
        state,
        vars: (0, utils_1.prepareSandboxVars)(variables)
    };
    if (updateStateMemory && updateStateMemory !== 'updateStateMemoryUI' && updateStateMemory !== 'updateStateMemoryCode') {
        try {
            const parsedSchema = typeof updateStateMemory === 'string' ? JSON.parse(updateStateMemory) : updateStateMemory;
            const obj = {};
            for (const sch of parsedSchema) {
                const key = sch.Key;
                if (!key)
                    throw new Error(`Key is required`);
                let value = sch.Value;
                if (value.startsWith('$flow')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.Value.replace('$flow.', ''));
                }
                else if (value.startsWith('$vars')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.Value.replace('$', ''));
                }
                obj[key] = value;
            }
            return obj;
        }
        catch (e) {
            throw new Error(e);
        }
    }
    if (selectedTab === 'updateStateMemoryUI' && updateStateMemoryUI) {
        try {
            const parsedSchema = typeof updateStateMemoryUI === 'string' ? JSON.parse(updateStateMemoryUI) : updateStateMemoryUI;
            const obj = {};
            for (const sch of parsedSchema) {
                const key = sch.key;
                if (!key)
                    throw new Error(`Key is required`);
                let value = sch.value;
                if (value.startsWith('$flow')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.value.replace('$flow.', ''));
                }
                else if (value.startsWith('$vars')) {
                    value = (0, commonUtils_1.customGet)(flow, sch.value.replace('$', ''));
                }
                obj[key] = value;
            }
            return obj;
        }
        catch (e) {
            throw new Error(e);
        }
    }
    else if (selectedTab === 'updateStateMemoryCode' && updateStateMemoryCode) {
        const sandbox = (0, utils_1.createCodeExecutionSandbox)(input, variables, flow);
        try {
            const response = await (0, utils_1.executeJavaScriptCode)(updateStateMemoryCode, sandbox);
            if (typeof response !== 'object')
                throw new Error('Return output must be an object');
            return response;
        }
        catch (e) {
            throw new Error(e);
        }
    }
};
module.exports = { nodeClass: LLMNode_SeqAgents };
//# sourceMappingURL=LLMNode.js.map