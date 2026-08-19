"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const httpSecurity_1 = require("../../../src/httpSecurity");
const utils_1 = require("../../../src/utils");
const validator_1 = require("../../../src/validator");
const utils_2 = require("../utils");
const lodash_1 = require("lodash");
class ExecuteFlow_Agentflow {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listFlows(_, options) {
                const returnData = [];
                const appDataSource = options.appDataSource;
                const databaseEntities = options.databaseEntities;
                if (appDataSource === undefined || !appDataSource) {
                    return returnData;
                }
                const searchOptions = options.searchOptions || {};
                const chatflows = await appDataSource.getRepository(databaseEntities['ChatFlow']).findBy(searchOptions);
                for (let i = 0; i < chatflows.length; i += 1) {
                    let cfType = 'Chatflow';
                    if (chatflows[i].type === 'AGENTFLOW') {
                        cfType = 'Agentflow V2';
                    }
                    else if (chatflows[i].type === 'MULTIAGENT') {
                        cfType = 'Agentflow V1';
                    }
                    const data = {
                        label: chatflows[i].name,
                        name: chatflows[i].id,
                        description: cfType
                    };
                    returnData.push(data);
                }
                // order by label
                return returnData.sort((a, b) => a.label.localeCompare(b.label));
            },
            async listRuntimeStateKeys(_, options) {
                const previousNodes = options.previousNodes;
                const startAgentflowNode = previousNodes.find((node) => node.name === 'startAgentflow');
                const state = startAgentflowNode?.inputs?.startState;
                return state.map((item) => ({ label: item.key, name: item.key }));
            }
        };
        this.label = 'Execute Flow';
        this.name = 'executeFlowAgentflow';
        this.version = 1.2;
        this.type = 'ExecuteFlow';
        this.category = 'Agent Flows';
        this.description = 'Execute another flow';
        this.baseClasses = [this.type];
        this.color = '#a3b18a';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['chatflowApi'],
            optional: true
        };
        this.inputs = [
            {
                label: 'Select Flow',
                name: 'executeFlowSelectedFlow',
                type: 'asyncOptions',
                loadMethod: 'listFlows'
            },
            {
                label: 'Input',
                name: 'executeFlowInput',
                type: 'string',
                rows: 4,
                acceptVariable: true
            },
            {
                label: 'Override Config',
                name: 'executeFlowOverrideConfig',
                description: 'Override the config passed to the flow',
                type: 'json',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'Base URL',
                name: 'executeFlowBaseURL',
                type: 'string',
                description: 'Base URL to Flowise. By default, it is the URL of the incoming request. Useful when you need to execute flow through an alternative route.',
                placeholder: 'http://localhost:3000',
                optional: true
            },
            {
                label: 'Return Response As',
                name: 'executeFlowReturnResponseAs',
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
                label: 'Update Flow State',
                name: 'executeFlowUpdateState',
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
    async run(nodeData, _, options) {
        const baseURL = nodeData.inputs?.executeFlowBaseURL || options.baseURL;
        const selectedFlowId = nodeData.inputs?.executeFlowSelectedFlow;
        const flowInput = nodeData.inputs?.executeFlowInput;
        const returnResponseAs = nodeData.inputs?.executeFlowReturnResponseAs;
        const _executeFlowUpdateState = nodeData.inputs?.executeFlowUpdateState;
        let overrideConfig = nodeData.inputs?.executeFlowOverrideConfig;
        if (typeof overrideConfig === 'string' && overrideConfig.startsWith('{') && overrideConfig.endsWith('}')) {
            try {
                overrideConfig = (0, utils_1.parseJsonBody)(overrideConfig);
            }
            catch (parseError) {
                throw new Error(`Invalid JSON in executeFlowOverrideConfig: ${parseError.message}`);
            }
        }
        const state = options.agentflowRuntime?.state;
        const runtimeChatHistory = options.agentflowRuntime?.chatHistory ?? [];
        const isLastNode = options.isLastNode;
        const sseStreamer = options.sseStreamer;
        try {
            const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
            const chatflowApiKey = (0, utils_1.getCredentialParam)('chatflowApiKey', credentialData, nodeData);
            if (!baseURL || !(0, validator_1.isValidURL)(baseURL))
                throw new Error('Invalid base URL: must be a valid URL');
            if (selectedFlowId === options.chatflowid)
                throw new Error('Cannot call the same agentflow!');
            let headers = {
                'Content-Type': 'application/json',
                'flowise-tool': 'true'
            };
            if (chatflowApiKey)
                headers = { ...headers, Authorization: `Bearer ${chatflowApiKey}` };
            const finalUrl = `${baseURL}/api/prediction/${selectedFlowId}`;
            const requestConfig = {
                method: 'POST',
                url: finalUrl,
                headers,
                data: {
                    question: flowInput,
                    chatId: options.chatId,
                    overrideConfig
                }
            };
            const response = await (0, httpSecurity_1.secureAxiosRequest)(requestConfig);
            let resultText = '';
            const { sourceDocuments, usedTools, artifacts, fileAnnotations } = response.data;
            const flattenedSourceDocuments = Array.isArray(sourceDocuments) ? (0, lodash_1.flatten)(sourceDocuments) : [];
            const flattenedUsedTools = Array.isArray(usedTools) ? (0, lodash_1.flatten)(usedTools) : [];
            const flattenedArtifacts = Array.isArray(artifacts) ? (0, lodash_1.flatten)(artifacts) : [];
            if (response.data.text)
                resultText = response.data.text;
            else if (response.data.json)
                resultText = '```json\n' + JSON.stringify(response.data.json, null, 2);
            else
                resultText = JSON.stringify(response.data, null, 2);
            if (isLastNode && sseStreamer) {
                sseStreamer.streamTokenEvent(options.chatId, resultText);
                if (flattenedSourceDocuments.length > 0) {
                    sseStreamer.streamSourceDocumentsEvent(options.chatId, flattenedSourceDocuments);
                }
                if (flattenedUsedTools.length > 0) {
                    sseStreamer.streamUsedToolsEvent(options.chatId, flattenedUsedTools);
                }
                if (flattenedArtifacts.length > 0) {
                    sseStreamer.streamArtifactsEvent(options.chatId, flattenedArtifacts);
                }
                if (fileAnnotations) {
                    sseStreamer.streamFileAnnotationsEvent(options.chatId, fileAnnotations);
                }
            }
            // Update flow state if needed
            let newState = { ...state };
            if (_executeFlowUpdateState && Array.isArray(_executeFlowUpdateState) && _executeFlowUpdateState.length > 0) {
                newState = (0, utils_2.updateFlowState)(state, _executeFlowUpdateState);
            }
            // Process template variables in state
            newState = (0, utils_1.processTemplateVariables)(newState, resultText);
            // Only add to runtime chat history if this is the first node
            const inputMessages = [];
            if (!runtimeChatHistory.length) {
                inputMessages.push({ role: 'user', content: flowInput });
            }
            let returnRole = 'user';
            if (returnResponseAs === 'assistantMessage') {
                returnRole = 'assistant';
            }
            const returnOutput = {
                id: nodeData.id,
                name: this.name,
                input: {
                    messages: [
                        {
                            role: 'user',
                            content: flowInput
                        }
                    ]
                },
                output: {
                    content: resultText,
                    ...(flattenedSourceDocuments.length > 0 && { sourceDocuments: flattenedSourceDocuments }),
                    ...(flattenedUsedTools.length > 0 && { usedTools: flattenedUsedTools }),
                    ...(flattenedArtifacts.length > 0 && { artifacts: flattenedArtifacts }),
                    ...(fileAnnotations && fileAnnotations.length > 0 && { fileAnnotations })
                },
                state: newState,
                chatHistory: [
                    ...inputMessages,
                    {
                        role: returnRole,
                        content: resultText,
                        name: nodeData?.label ? nodeData?.label.toLowerCase().replace(/\s/g, '_').trim() : nodeData?.id,
                        ...((flattenedArtifacts.length > 0 ||
                            (fileAnnotations && fileAnnotations.length > 0) ||
                            flattenedUsedTools.length > 0) && {
                            additional_kwargs: {
                                ...(flattenedArtifacts.length > 0 && { artifacts: flattenedArtifacts }),
                                ...(fileAnnotations && fileAnnotations.length > 0 && { fileAnnotations }),
                                ...(flattenedUsedTools.length > 0 && { usedTools: flattenedUsedTools })
                            }
                        })
                    }
                ]
            };
            return returnOutput;
        }
        catch (error) {
            console.error('ExecuteFlow Error:', error);
            // Format error response
            const errorResponse = {
                id: nodeData.id,
                name: this.name,
                input: {
                    messages: [
                        {
                            role: 'user',
                            content: flowInput
                        }
                    ]
                },
                error: {
                    name: error.name || 'Error',
                    message: error.message || 'An error occurred during the execution of the flow'
                },
                state
            };
            // Add more error details if available
            if (error.response) {
                errorResponse.error.status = error.response.status;
                errorResponse.error.statusText = error.response.statusText;
                errorResponse.error.data = error.response.data;
                errorResponse.error.headers = error.response.headers;
            }
            throw new Error(error);
        }
    }
}
module.exports = { nodeClass: ExecuteFlow_Agentflow };
//# sourceMappingURL=ExecuteFlow.js.map