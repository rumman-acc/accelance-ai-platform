"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const messages_1 = require("@langchain/core/messages");
const commonUtils_1 = require("../commonUtils");
const howToUseCode = `
1. Must return a string value at the end of function.

2. You can get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

3. You can get custom variables: \`$vars.<variable-name>\`

`;
class CustomFunction_SeqAgents {
    constructor() {
        this.label = 'Custom JS Function';
        this.name = 'seqCustomFunction';
        this.version = 1.0;
        this.type = 'CustomFunction';
        this.icon = 'customfunction.svg';
        this.category = 'Sequential Agents';
        this.description = `Execute custom javascript function`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Input Variables',
                name: 'functionInputVariables',
                description: 'Input variables can be used in the function with prefix $. For example: $var',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true
            },
            {
                label: 'Sequential Node',
                name: 'sequentialNode',
                type: 'Start | Agent | Condition | LLMNode | ToolNode | CustomFunction | ExecuteFlow',
                description: 'Can be connected to one of the following nodes: Start, Agent, Condition, LLM Node, Tool Node, Custom Function, Execute Flow',
                list: true
            },
            {
                label: 'Function Name',
                name: 'functionName',
                type: 'string',
                placeholder: 'My Function'
            },
            {
                label: 'Javascript Function',
                name: 'javascriptFunction',
                type: 'code',
                hint: {
                    label: 'How to use',
                    value: howToUseCode
                }
            },
            {
                label: 'Return Value As',
                name: 'returnValueAs',
                type: 'options',
                options: [
                    { label: 'AI Message', name: 'aiMessage' },
                    { label: 'Human Message', name: 'humanMessage' },
                    {
                        label: 'State Object',
                        name: 'stateObj',
                        description: "Return as state object, ex: { foo: bar }. This will update the custom state 'foo' to 'bar'"
                    }
                ],
                default: 'aiMessage'
            }
        ];
    }
    async init(nodeData, input, options) {
        const functionName = nodeData.inputs?.functionName;
        const javascriptFunction = nodeData.inputs?.javascriptFunction;
        const functionInputVariablesRaw = nodeData.inputs?.functionInputVariables;
        const appDataSource = options.appDataSource;
        const databaseEntities = options.databaseEntities;
        const sequentialNodes = nodeData.inputs?.sequentialNode;
        const returnValueAs = nodeData.inputs?.returnValueAs;
        if (!sequentialNodes || !sequentialNodes.length)
            throw new Error('Custom function must have a predecessor!');
        const executeFunc = async (state) => {
            const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options);
            const flow = {
                chatflowId: options.chatflowid,
                sessionId: options.sessionId,
                chatId: options.chatId,
                input,
                state
            };
            let inputVars = {};
            if (functionInputVariablesRaw) {
                try {
                    inputVars =
                        typeof functionInputVariablesRaw === 'object' ? functionInputVariablesRaw : JSON.parse(functionInputVariablesRaw);
                }
                catch (exception) {
                    throw new Error('Invalid JSON in the Custom Function Input Variables: ' + exception);
                }
            }
            // Some values might be a stringified JSON, parse it
            for (const key in inputVars) {
                let value = inputVars[key];
                if (typeof value === 'string') {
                    value = (0, utils_1.handleEscapeCharacters)(value, true);
                    if (value.startsWith('{') && value.endsWith('}')) {
                        try {
                            value = JSON.parse(value);
                            const nodeId = value.id || '';
                            if (nodeId) {
                                const messages = state.messages;
                                const content = messages.find((msg) => msg.additional_kwargs?.nodeId === nodeId)?.content;
                                if (content) {
                                    value = content;
                                }
                            }
                        }
                        catch (e) {
                            // ignore
                        }
                    }
                    if (value.startsWith('$flow.')) {
                        const variableValue = (0, commonUtils_1.customGet)(flow, value.replace('$flow.', ''));
                        if (variableValue) {
                            value = variableValue;
                        }
                    }
                    else if (value.startsWith('$vars')) {
                        value = (0, commonUtils_1.customGet)(flow, value.replace('$', ''));
                    }
                    inputVars[key] = value;
                }
            }
            // Create additional sandbox variables
            const additionalSandbox = {};
            // Add input variables to sandbox
            if (Object.keys(inputVars).length) {
                for (const item in inputVars) {
                    additionalSandbox[`$${item}`] = inputVars[item];
                }
            }
            const sandbox = (0, utils_1.createCodeExecutionSandbox)(input, variables, flow, additionalSandbox);
            try {
                const response = await (0, utils_1.executeJavaScriptCode)(javascriptFunction, sandbox);
                if (returnValueAs === 'stateObj') {
                    if (typeof response !== 'object') {
                        throw new Error('Custom function must return an object!');
                    }
                    return {
                        ...state,
                        ...response
                    };
                }
                if (typeof response !== 'string') {
                    throw new Error('Custom function must return a string!');
                }
                if (returnValueAs === 'humanMessage') {
                    return {
                        messages: [
                            new messages_1.HumanMessage({
                                content: response,
                                additional_kwargs: {
                                    nodeId: nodeData.id
                                }
                            })
                        ]
                    };
                }
                return {
                    messages: [
                        new messages_1.AIMessage({
                            content: response,
                            additional_kwargs: {
                                nodeId: nodeData.id
                            }
                        })
                    ]
                };
            }
            catch (e) {
                throw new Error(e);
            }
        };
        const startLLM = sequentialNodes[0].startLLM;
        const returnOutput = {
            id: nodeData.id,
            node: executeFunc,
            name: functionName.toLowerCase().replace(/\s/g, '_').trim(),
            label: functionName,
            type: 'utilities',
            output: 'CustomFunction',
            llm: startLLM,
            startLLM,
            multiModalMessageContent: sequentialNodes[0]?.multiModalMessageContent,
            predecessorAgents: sequentialNodes
        };
        return returnOutput;
    }
}
module.exports = { nodeClass: CustomFunction_SeqAgents };
//# sourceMappingURL=CustomFunction.js.map