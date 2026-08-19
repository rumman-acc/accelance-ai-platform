"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const utils_2 = require("../utils");
const exampleFunc = `/*
* You can use any libraries imported in Flowise
* You can use properties specified in Input Variables with the prefix $. For example: $foo
* You can get default flow config: $flow.sessionId, $flow.chatId, $flow.chatflowId, $flow.input, $flow.state
* You can get global variables: $vars.<variable-name>
* Must return a string value at the end of function
*/

const fetch = require('node-fetch');
const url = 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true';
const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};
try {
    const response = await fetch(url, options);
    const text = await response.text();
    return text;
} catch (error) {
    console.error(error);
    return '';
}`;
class CustomFunction_Agentflow {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listRuntimeStateKeys(_, options) {
                const previousNodes = options.previousNodes;
                const startAgentflowNode = previousNodes.find((node) => node.name === 'startAgentflow');
                const state = startAgentflowNode?.inputs?.startState;
                return state.map((item) => ({ label: item.key, name: item.key }));
            }
        };
        this.label = 'Custom Function';
        this.name = 'customFunctionAgentflow';
        this.version = 1.1;
        this.type = 'CustomFunction';
        this.category = 'Agent Flows';
        this.description = 'Execute custom function';
        this.baseClasses = [this.type];
        this.color = '#E4B7FF';
        this.inputs = [
            {
                label: 'Input Variables',
                name: 'customFunctionInputVariables',
                description: 'Input variables can be used in the function with prefix $. For example: $foo',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Variable Name',
                        name: 'variableName',
                        type: 'string'
                    },
                    {
                        label: 'Variable Value',
                        name: 'variableValue',
                        type: 'string',
                        acceptVariable: true
                    }
                ]
            },
            {
                label: 'Javascript Function',
                name: 'customFunctionJavascriptFunction',
                type: 'code',
                codeExample: exampleFunc,
                description: 'The function to execute. Must return a string or an object that can be converted to a string.'
            },
            {
                label: 'Update Flow State',
                name: 'customFunctionUpdateState',
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
        ];
    }
    async run(nodeData, input, options) {
        const javascriptFunction = nodeData.inputs?.customFunctionJavascriptFunction;
        const functionInputVariables = nodeData.inputs?.customFunctionInputVariables ?? [];
        const _customFunctionUpdateState = nodeData.inputs?.customFunctionUpdateState;
        const state = options.agentflowRuntime?.state;
        const chatId = options.chatId;
        const isLastNode = options.isLastNode;
        const isStreamable = isLastNode && options.sseStreamer !== undefined;
        const appDataSource = options.appDataSource;
        const databaseEntities = options.databaseEntities;
        const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options);
        const flow = {
            input,
            state,
            chatflowId: options.chatflowid,
            sessionId: options.sessionId,
            chatId: options.chatId,
            rawOutput: options.postProcessing?.rawOutput || '',
            chatHistory: options.postProcessing?.chatHistory || [],
            sourceDocuments: options.postProcessing?.sourceDocuments,
            usedTools: options.postProcessing?.usedTools,
            artifacts: options.postProcessing?.artifacts,
            fileAnnotations: options.postProcessing?.fileAnnotations
        };
        // Create additional sandbox variables for custom function inputs
        const additionalSandbox = {};
        for (const item of functionInputVariables) {
            const variableName = item.variableName;
            const variableValue = item.variableValue;
            additionalSandbox[`$${variableName}`] = variableValue;
        }
        const sandbox = (0, utils_1.createCodeExecutionSandbox)(input, variables, flow, additionalSandbox);
        // Setup streaming function if needed
        const streamOutput = isStreamable
            ? (output) => {
                const sseStreamer = options.sseStreamer;
                sseStreamer.streamTokenEvent(chatId, output);
            }
            : undefined;
        try {
            const response = await (0, utils_1.executeJavaScriptCode)(javascriptFunction, sandbox, {
                libraries: ['axios'],
                streamOutput
            });
            let finalOutput = response;
            if (typeof response === 'object') {
                finalOutput = JSON.stringify(response, null, 2);
            }
            // Update flow state if needed
            let newState = { ...state };
            if (_customFunctionUpdateState && Array.isArray(_customFunctionUpdateState) && _customFunctionUpdateState.length > 0) {
                newState = (0, utils_2.updateFlowState)(state, _customFunctionUpdateState);
            }
            newState = (0, utils_1.processTemplateVariables)(newState, finalOutput);
            const returnOutput = {
                id: nodeData.id,
                name: this.name,
                input: {
                    inputVariables: functionInputVariables,
                    code: javascriptFunction
                },
                output: {
                    content: finalOutput
                },
                state: newState
            };
            return returnOutput;
        }
        catch (e) {
            throw new Error(e);
        }
    }
}
module.exports = { nodeClass: CustomFunction_Agentflow };
//# sourceMappingURL=CustomFunction.js.map