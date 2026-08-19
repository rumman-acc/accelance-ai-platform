"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const v3_1 = require("zod/v3");
const manager_1 = require("@langchain/core/callbacks/manager");
const tools_1 = require("@langchain/core/tools");
const utils_1 = require("../../../src/utils");
const validator_1 = require("../../../src/validator");
const uuid_1 = require("uuid");
class AgentAsTool_Tools {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listAgentflows(_, options) {
                const returnData = [];
                const appDataSource = options.appDataSource;
                const databaseEntities = options.databaseEntities;
                if (appDataSource === undefined || !appDataSource) {
                    return returnData;
                }
                const searchOptions = options.searchOptions || {};
                const agentflows = await appDataSource.getRepository(databaseEntities['ChatFlow']).findBy({
                    ...searchOptions,
                    type: 'AGENTFLOW'
                });
                for (let i = 0; i < agentflows.length; i += 1) {
                    const data = {
                        label: agentflows[i].name,
                        name: agentflows[i].id
                    };
                    returnData.push(data);
                }
                return returnData;
            }
        };
        this.label = 'Agent as Tool';
        this.name = 'agentAsTool';
        this.version = 1.0;
        this.type = 'AgentAsTool';
        this.icon = 'agentastool.svg';
        this.category = 'Tools';
        this.description = 'Use as a tool to execute another agentflow';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['agentflowApi'],
            optional: true
        };
        this.inputs = [
            {
                label: 'Select Agent',
                name: 'selectedAgentflow',
                type: 'asyncOptions',
                loadMethod: 'listAgentflows'
            },
            {
                label: 'Tool Name',
                name: 'name',
                type: 'string'
            },
            {
                label: 'Tool Description',
                name: 'description',
                type: 'string',
                description: 'Description of what the tool does. This is for LLM to determine when to use this tool.',
                rows: 3,
                placeholder: 'State of the Union QA - useful for when you need to ask questions about the most recent state of the union address.'
            },
            {
                label: 'Return Direct',
                name: 'returnDirect',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Override Config',
                name: 'overrideConfig',
                description: 'Override the config passed to the Agentflow.',
                type: 'json',
                optional: true,
                additionalParams: true,
                acceptVariable: true
            },
            {
                label: 'Base URL',
                name: 'baseURL',
                type: 'string',
                description: 'Base URL to Flowise. By default, it is the URL of the incoming request. Useful when you need to execute the Agentflow through an alternative route.',
                placeholder: 'http://localhost:3000',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Start new session per message',
                name: 'startNewSession',
                type: 'boolean',
                description: 'Whether to continue the session with the Agentflow tool or start a new one with each interaction. Useful for Agentflows with memory if you want to avoid it.',
                default: false,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Use Question from Chat',
                name: 'useQuestionFromChat',
                type: 'boolean',
                description: 'Whether to use the question from the chat as input to the agentflow. If turned on, this will override the custom input.',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Custom Input',
                name: 'customInput',
                type: 'string',
                description: 'Custom input to be passed to the agentflow. Leave empty to let LLM decides the input.',
                optional: true,
                additionalParams: true,
                show: {
                    useQuestionFromChat: false
                }
            }
        ];
    }
    async init(nodeData, input, options) {
        const selectedAgentflowId = nodeData.inputs?.selectedAgentflow;
        const _name = nodeData.inputs?.name;
        const description = nodeData.inputs?.description;
        const useQuestionFromChat = nodeData.inputs?.useQuestionFromChat;
        const returnDirect = nodeData.inputs?.returnDirect;
        const customInput = nodeData.inputs?.customInput;
        const overrideConfig = typeof nodeData.inputs?.overrideConfig === 'string' &&
            nodeData.inputs.overrideConfig.startsWith('{') &&
            nodeData.inputs.overrideConfig.endsWith('}')
            ? JSON.parse(nodeData.inputs.overrideConfig)
            : nodeData.inputs?.overrideConfig;
        const startNewSession = nodeData.inputs?.startNewSession;
        const baseURL = nodeData.inputs?.baseURL || options.baseURL;
        // Validate agentflowid is a valid UUID
        if (!selectedAgentflowId || !(0, validator_1.isValidUUID)(selectedAgentflowId)) {
            throw new Error('Invalid agentflow ID: must be a valid UUID');
        }
        // Validate baseURL is a valid URL
        if (!baseURL || !(0, validator_1.isValidURL)(baseURL)) {
            throw new Error('Invalid base URL: must be a valid URL');
        }
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const agentflowApiKey = (0, utils_1.getCredentialParam)('agentflowApiKey', credentialData, nodeData);
        if (selectedAgentflowId === options.chatflowid)
            throw new Error('Cannot call the same agentflow!');
        let headers = {};
        if (agentflowApiKey)
            headers = { Authorization: `Bearer ${agentflowApiKey}` };
        let toolInput = '';
        if (useQuestionFromChat) {
            toolInput = input;
        }
        else if (customInput) {
            toolInput = customInput;
        }
        let name = _name || 'agentflow_tool';
        // Thread the original triggering user's identity to the inner call so the target
        // agentflow's own confused-deputy-prevention check (if enabled for its workspace) can
        // verify and use it, instead of the inner call always running with no principal. The
        // receiving end re-verifies workspace membership before trusting this -- see
        // utils/preflightGuardrails.ts's resolveTrustedToolCallerUserId.
        const triggeringUserId = options.userId;
        if (triggeringUserId)
            headers = { ...headers, 'x-original-user-id': triggeringUserId };
        return new AgentflowTool({
            name,
            baseURL,
            description,
            returnDirect,
            agentflowid: selectedAgentflowId,
            startNewSession,
            headers,
            input: toolInput,
            overrideConfig
        });
    }
}
class AgentflowTool extends tools_1.StructuredTool {
    static lc_name() {
        return 'AgentflowTool';
    }
    constructor({ name, description, returnDirect, input, agentflowid, startNewSession, baseURL, headers, overrideConfig }) {
        super();
        this.name = 'agentflow_tool';
        this.description = 'Execute another agentflow';
        this.input = '';
        this.agentflowid = '';
        this.startNewSession = false;
        this.baseURL = 'http://localhost:3000';
        this.headers = {};
        this.schema = v3_1.z.object({
            input: v3_1.z.string().describe('input question')
            // overrideConfig: z.record(z.any()).optional().describe('override config'), // This will be passed to the Agent, so comment it for now.
        });
        this.name = name;
        this.description = description;
        this.input = input;
        this.baseURL = baseURL;
        this.startNewSession = startNewSession;
        this.headers = headers;
        this.agentflowid = agentflowid;
        this.overrideConfig = overrideConfig;
        this.returnDirect = returnDirect;
    }
    async call(arg, configArg, tags, flowConfig) {
        const config = (0, manager_1.parseCallbackConfigArg)(configArg);
        if (config.runName === undefined) {
            config.runName = this.name;
        }
        let parsed;
        try {
            parsed = await (0, utils_1.parseWithTypeConversion)(this.schema, arg);
        }
        catch (e) {
            throw new Error(`Received tool input did not match expected schema: ${JSON.stringify(arg)}`);
        }
        const callbackManager_ = await manager_1.CallbackManager.configure(config.callbacks, this.callbacks, config.tags || tags, this.tags, config.metadata, this.metadata, { verbose: this.verbose });
        const runManager = await callbackManager_?.handleToolStart(this.toJSON(), typeof parsed === 'string' ? parsed : JSON.stringify(parsed), undefined, undefined, undefined, undefined, config.runName);
        let result;
        try {
            result = await this._call(parsed, runManager, flowConfig);
        }
        catch (e) {
            await runManager?.handleToolError(e);
            throw e;
        }
        if (result && typeof result !== 'string') {
            result = JSON.stringify(result);
        }
        await runManager?.handleToolEnd(result);
        return result;
    }
    // @ts-ignore
    async _call(arg, _, flowConfig) {
        const inputQuestion = this.input || arg.input;
        const body = {
            question: inputQuestion,
            chatId: this.startNewSession ? (0, uuid_1.v4)() : flowConfig?.chatId,
            overrideConfig: {
                sessionId: this.startNewSession ? (0, uuid_1.v4)() : flowConfig?.sessionId,
                ...(this.overrideConfig ?? {}),
                ...(arg.overrideConfig ?? {})
            }
        };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'flowise-tool': 'true',
                ...this.headers
            },
            body: JSON.stringify(body)
        };
        const code = `
const fetch = require('node-fetch');
const url = $apiURL;

const body = $callBody;

const options = $callOptions;

try {
	const response = await fetch(url, options);
	const resp = await response.json();
	return resp.text;
} catch (error) {
	console.error(error);
	return '';
}
`;
        // Create additional sandbox variables
        const additionalSandbox = {
            $callOptions: options,
            $callBody: body,
            $apiURL: `${this.baseURL}/api/prediction/${this.agentflowid}`
        };
        const sandbox = (0, utils_1.createCodeExecutionSandbox)('', [], {}, additionalSandbox);
        let response = await (0, utils_1.executeJavaScriptCode)(code, sandbox, {
            useSandbox: false
        });
        if (typeof response === 'object') {
            response = JSON.stringify(response);
        }
        return response;
    }
}
module.exports = { nodeClass: AgentAsTool_Tools };
//# sourceMappingURL=AgentAsTool.js.map