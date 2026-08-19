"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const prompts_1 = require("@langchain/core/prompts");
const v3_1 = require("zod/v3");
const tools_1 = require("@langchain/core/tools");
const agents_1 = require("../../../src/agents");
const mistralai_1 = require("@langchain/mistralai");
const FlowiseChatOpenAI_1 = require("../../chatmodels/ChatOpenAI/FlowiseChatOpenAI");
const FlowiseChatAnthropic_1 = require("../../chatmodels/ChatAnthropic/FlowiseChatAnthropic");
const multiModalUtils_1 = require("../../../src/multiModalUtils");
const FlowiseChatGoogleGenerativeAI_1 = require("../../chatmodels/ChatGoogleGenerativeAI/FlowiseChatGoogleGenerativeAI");
const FlowiseAzureChatOpenAI_1 = require("../../chatmodels/AzureChatOpenAI/FlowiseAzureChatOpenAI");
const sysPrompt = `You are a supervisor tasked with managing a conversation between the following workers: {team_members}.
Given the following user request, respond with the worker to act next.
Each worker will perform a task and respond with their results and status.
When finished, respond with FINISH.
Select strategically to minimize the number of steps taken.`;
const routerToolName = 'route';
const defaultSummarization = 'Conversation finished';
const defaultInstruction = 'Conversation finished';
class Supervisor_MultiAgents {
    constructor() {
        this.label = 'Supervisor';
        this.name = 'supervisor';
        this.version = 3.0;
        this.type = 'Supervisor';
        this.icon = 'supervisor.svg';
        this.category = 'Multi Agents';
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Supervisor Name',
                name: 'supervisorName',
                type: 'string',
                placeholder: 'Supervisor',
                default: 'Supervisor'
            },
            {
                label: 'Supervisor Prompt',
                name: 'supervisorPrompt',
                type: 'string',
                description: 'Prompt must contains {team_members}',
                rows: 4,
                default: sysPrompt,
                additionalParams: true
            },
            {
                label: 'Tool Calling Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                description: `Only compatible with models that are capable of function calling: ChatOpenAI, ChatMistral, ChatAnthropic, ChatGoogleGenerativeAI, GroqChat. Best result with GPT-4 model`
            },
            {
                label: 'Agent Memory',
                name: 'agentMemory',
                type: 'BaseCheckpointSaver',
                description: 'Save the state of the agent',
                optional: true
            },
            {
                label: 'Summarization',
                name: 'summarization',
                type: 'boolean',
                description: 'Return final output as a summarization of the conversation',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Recursion Limit',
                name: 'recursionLimit',
                type: 'number',
                description: 'Maximum number of times a call can recurse. If not provided, defaults to 100.',
                default: 100,
                additionalParams: true
            },
            {
                label: 'Input Moderation',
                description: 'Detect text that could generate harmful output and prevent it from being sent to the language model',
                name: 'inputModeration',
                type: 'Moderation',
                optional: true,
                list: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const llm = nodeData.inputs?.model;
        const supervisorPrompt = nodeData.inputs?.supervisorPrompt;
        const supervisorLabel = nodeData.inputs?.supervisorName;
        const _recursionLimit = nodeData.inputs?.recursionLimit;
        const recursionLimit = _recursionLimit ? parseFloat(_recursionLimit) : 100;
        const moderations = nodeData.inputs?.inputModeration ?? [];
        const summarization = nodeData.inputs?.summarization;
        const abortControllerSignal = options.signal;
        const workersNodes = nodeData.inputs?.workerNodes && nodeData.inputs?.workerNodes.length ? (0, lodash_1.flatten)(nodeData.inputs?.workerNodes) : [];
        const workersNodeNames = workersNodes.map((node) => node.name);
        if (!supervisorLabel)
            throw new Error('Supervisor name is required!');
        const supervisorName = supervisorLabel.toLowerCase().replace(/\s/g, '_').trim();
        let multiModalMessageContent = [];
        async function createTeamSupervisor(llm, systemPrompt, members) {
            const memberOptions = ['FINISH', ...members];
            systemPrompt = systemPrompt.replaceAll('{team_members}', members.join(', '));
            let userPrompt = `Given the conversation above, who should act next? Or should we FINISH? Select one of: ${memberOptions.join(', ')}`;
            const tool = new RouteTool({
                schema: v3_1.z.object({
                    reasoning: v3_1.z.string(),
                    next: v3_1.z.enum(['FINISH', ...members]),
                    instructions: v3_1.z.string().describe('The specific instructions of the sub-task the next role should accomplish.')
                })
            });
            let supervisor;
            if (llm instanceof mistralai_1.ChatMistralAI) {
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                const messages = await processImageMessage(1, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                // Force Mistral to use tool
                const modelWithTool = llm.bindTools([tool]).withConfig({
                    tool_choice: 'any',
                    signal: abortControllerSignal ? abortControllerSignal.signal : undefined
                });
                const outputParser = new agents_1.JsonOutputToolsParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: Object.keys(toolAgentAction.args).length ? toolAgentAction.args.next : 'FINISH',
                            instructions: Object.keys(toolAgentAction.args).length
                                ? toolAgentAction.args.instructions
                                : 'Conversation finished',
                            team_members: members.join(', ')
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: 'Conversation finished',
                            team_members: members.join(', ')
                        };
                    }
                });
            }
            else if (llm instanceof FlowiseChatAnthropic_1.ChatAnthropic) {
                // Force Anthropic to use tool : https://docs.anthropic.com/claude/docs/tool-use#forcing-tool-use
                userPrompt = `Given the conversation above, who should act next? Or should we FINISH? Select one of: ${memberOptions.join(', ')}. Use the ${routerToolName} tool in your response.`;
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                const messages = await processImageMessage(1, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                if (llm.bindTools === undefined) {
                    throw new Error(`This agent only compatible with function calling models.`);
                }
                const modelWithTool = llm.bindTools([tool]);
                const outputParser = new agents_1.ToolCallingAgentOutputParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: toolAgentAction.toolInput.next,
                            instructions: toolAgentAction.toolInput.instructions,
                            team_members: members.join(', ')
                        };
                    }
                    else if (typeof x === 'object' && 'returnValues' in x) {
                        return {
                            next: 'FINISH',
                            instructions: x.returnValues?.output,
                            team_members: members.join(', ')
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: 'Conversation finished',
                            team_members: members.join(', ')
                        };
                    }
                });
            }
            else if (llm instanceof FlowiseChatOpenAI_1.ChatOpenAI || llm instanceof FlowiseAzureChatOpenAI_1.AzureChatOpenAI) {
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                // @ts-ignore
                const messages = await processImageMessage(1, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                // Force OpenAI to use tool
                const modelWithTool = llm.bindTools([tool]).withConfig({
                    tool_choice: { type: 'function', function: { name: routerToolName } },
                    signal: abortControllerSignal ? abortControllerSignal.signal : undefined
                });
                const outputParser = new agents_1.ToolCallingAgentOutputParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: toolAgentAction.toolInput.next,
                            instructions: toolAgentAction.toolInput.instructions,
                            team_members: members.join(', ')
                        };
                    }
                    else if (typeof x === 'object' && 'returnValues' in x) {
                        return {
                            next: 'FINISH',
                            instructions: x.returnValues?.output,
                            team_members: members.join(', ')
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: 'Conversation finished',
                            team_members: members.join(', ')
                        };
                    }
                });
            }
            else if (llm instanceof FlowiseChatGoogleGenerativeAI_1.ChatGoogleGenerativeAI) {
                /*
                 * Gemini doesn't have system message and messages have to be alternate between model and user
                 * So we have to place the system + human prompt at last
                 */
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                const messages = await processImageMessage(2, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                if (llm.bindTools === undefined) {
                    throw new Error(`This agent only compatible with function calling models.`);
                }
                const modelWithTool = llm.bindTools([tool]);
                const outputParser = new agents_1.ToolCallingAgentOutputParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: toolAgentAction.toolInput.next,
                            instructions: toolAgentAction.toolInput.instructions,
                            team_members: members.join(', ')
                        };
                    }
                    else if (typeof x === 'object' && 'returnValues' in x) {
                        return {
                            next: 'FINISH',
                            instructions: x.returnValues?.output,
                            team_members: members.join(', ')
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: 'Conversation finished',
                            team_members: members.join(', ')
                        };
                    }
                });
            }
            else {
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                const messages = await processImageMessage(1, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                if (llm.bindTools === undefined) {
                    throw new Error(`This agent only compatible with function calling models.`);
                }
                const modelWithTool = llm.bindTools([tool]);
                const outputParser = new agents_1.ToolCallingAgentOutputParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: toolAgentAction.toolInput.next,
                            instructions: toolAgentAction.toolInput.instructions,
                            team_members: members.join(', ')
                        };
                    }
                    else if (typeof x === 'object' && 'returnValues' in x) {
                        return {
                            next: 'FINISH',
                            instructions: x.returnValues?.output,
                            team_members: members.join(', ')
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: 'Conversation finished',
                            team_members: members.join(', ')
                        };
                    }
                });
            }
            return supervisor;
        }
        async function createTeamSupervisorWithSummarize(llm, systemPrompt, members) {
            const memberOptions = ['FINISH', ...members];
            systemPrompt = systemPrompt.replaceAll('{team_members}', members.join(', '));
            let userPrompt = `Given the conversation above, who should act next? Or should we FINISH? Select one of: ${memberOptions.join(', ')}
            Remember to give reasonings, instructions and summarization`;
            const tool = new RouteTool({
                schema: v3_1.z.object({
                    reasoning: v3_1.z.string(),
                    next: v3_1.z.enum(['FINISH', ...members]),
                    instructions: v3_1.z.string().describe('The specific instructions of the sub-task the next role should accomplish.'),
                    summarization: v3_1.z.string().optional().describe('Summarization of the conversation')
                })
            });
            let supervisor;
            if (llm instanceof mistralai_1.ChatMistralAI) {
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                const messages = await processImageMessage(1, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                // Force Mistral to use tool
                const modelWithTool = llm.bindTools([tool]).withConfig({
                    tool_choice: 'any',
                    signal: abortControllerSignal ? abortControllerSignal.signal : undefined
                });
                const outputParser = new agents_1.JsonOutputToolsParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: Object.keys(toolAgentAction.args).length ? toolAgentAction.args.next : 'FINISH',
                            instructions: Object.keys(toolAgentAction.args).length
                                ? toolAgentAction.args.instructions
                                : defaultInstruction,
                            team_members: members.join(', '),
                            summarization: Object.keys(toolAgentAction.args).length ? toolAgentAction.args.summarization : ''
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: defaultInstruction,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                });
            }
            else if (llm instanceof FlowiseChatAnthropic_1.ChatAnthropic) {
                // Force Anthropic to use tool : https://docs.anthropic.com/claude/docs/tool-use#forcing-tool-use
                userPrompt = `Given the conversation above, who should act next? Or should we FINISH? Select one of: ${memberOptions.join(', ')}. Remember to give reasonings, instructions and summarization. Use the ${routerToolName} tool in your response.`;
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                const messages = await processImageMessage(1, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                if (llm.bindTools === undefined) {
                    throw new Error(`This agent only compatible with function calling models.`);
                }
                const modelWithTool = llm.bindTools([tool]);
                const outputParser = new agents_1.ToolCallingAgentOutputParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: toolAgentAction.toolInput.next,
                            instructions: toolAgentAction.toolInput.instructions,
                            team_members: members.join(', '),
                            summarization: toolAgentAction.toolInput.summarization
                        };
                    }
                    else if (typeof x === 'object' && 'returnValues' in x) {
                        return {
                            next: 'FINISH',
                            instructions: x.returnValues?.output,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: defaultInstruction,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                });
            }
            else if (llm instanceof FlowiseChatOpenAI_1.ChatOpenAI) {
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                // @ts-ignore
                const messages = await processImageMessage(1, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                // Force OpenAI to use tool
                const modelWithTool = llm.bindTools([tool]).withConfig({
                    tool_choice: { type: 'function', function: { name: routerToolName } },
                    signal: abortControllerSignal ? abortControllerSignal.signal : undefined
                });
                const outputParser = new agents_1.ToolCallingAgentOutputParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: toolAgentAction.toolInput.next,
                            instructions: toolAgentAction.toolInput.instructions,
                            team_members: members.join(', '),
                            summarization: toolAgentAction.toolInput.summarization
                        };
                    }
                    else if (typeof x === 'object' && 'returnValues' in x) {
                        return {
                            next: 'FINISH',
                            instructions: x.returnValues?.output,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: defaultInstruction,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                });
            }
            else if (llm instanceof FlowiseChatGoogleGenerativeAI_1.ChatGoogleGenerativeAI) {
                /*
                 * Gemini doesn't have system message and messages have to be alternate between model and user
                 * So we have to place the system + human prompt at last
                 */
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                const messages = await processImageMessage(2, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                if (llm.bindTools === undefined) {
                    throw new Error(`This agent only compatible with function calling models.`);
                }
                const modelWithTool = llm.bindTools([tool]);
                const outputParser = new agents_1.ToolCallingAgentOutputParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: toolAgentAction.toolInput.next,
                            instructions: toolAgentAction.toolInput.instructions,
                            team_members: members.join(', '),
                            summarization: toolAgentAction.toolInput.summarization
                        };
                    }
                    else if (typeof x === 'object' && 'returnValues' in x) {
                        return {
                            next: 'FINISH',
                            instructions: x.returnValues?.output,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: defaultInstruction,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                });
            }
            else {
                let prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ['system', systemPrompt],
                    new prompts_1.MessagesPlaceholder('messages'),
                    ['human', userPrompt]
                ]);
                const messages = await processImageMessage(1, llm, prompt, nodeData, options);
                prompt = messages.prompt;
                multiModalMessageContent = messages.multiModalMessageContent;
                if (llm.bindTools === undefined) {
                    throw new Error(`This agent only compatible with function calling models.`);
                }
                const modelWithTool = llm.bindTools([tool]);
                const outputParser = new agents_1.ToolCallingAgentOutputParser();
                supervisor = prompt
                    .pipe(modelWithTool)
                    .pipe(outputParser)
                    .pipe((x) => {
                    if (Array.isArray(x) && x.length) {
                        const toolAgentAction = x[0];
                        return {
                            next: toolAgentAction.toolInput.next,
                            instructions: toolAgentAction.toolInput.instructions,
                            team_members: members.join(', '),
                            summarization: toolAgentAction.toolInput.summarization
                        };
                    }
                    else if (typeof x === 'object' && 'returnValues' in x) {
                        return {
                            next: 'FINISH',
                            instructions: x.returnValues?.output,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                    else {
                        return {
                            next: 'FINISH',
                            instructions: defaultInstruction,
                            team_members: members.join(', '),
                            summarization: defaultSummarization
                        };
                    }
                });
            }
            return supervisor;
        }
        const supervisorAgent = summarization
            ? await createTeamSupervisorWithSummarize(llm, supervisorPrompt ? supervisorPrompt : sysPrompt, workersNodeNames)
            : await createTeamSupervisor(llm, supervisorPrompt ? supervisorPrompt : sysPrompt, workersNodeNames);
        const supervisorNode = async (state, config) => await agentNode({
            state,
            agent: supervisorAgent,
            nodeId: nodeData.id,
            abortControllerSignal
        }, config);
        const returnOutput = {
            node: supervisorNode,
            name: supervisorName ?? 'supervisor',
            label: supervisorLabel ?? 'Supervisor',
            type: 'supervisor',
            workers: workersNodeNames,
            recursionLimit,
            llm,
            moderations,
            multiModalMessageContent,
            checkpointMemory: nodeData.inputs?.agentMemory
        };
        return returnOutput;
    }
}
async function agentNode({ state, agent, nodeId, abortControllerSignal }, config) {
    try {
        if (abortControllerSignal.signal.aborted) {
            throw new Error('Aborted!');
        }
        const result = await agent.invoke({ ...state, signal: abortControllerSignal.signal }, config);
        const additional_kwargs = { nodeId, type: 'supervisor' };
        result.additional_kwargs = { ...result.additional_kwargs, ...additional_kwargs };
        return result;
    }
    catch (error) {
        throw new Error('Aborted!');
    }
}
const processImageMessage = async (index, llm, prompt, nodeData, options) => {
    let multiModalMessageContent = [];
    if ((0, multiModalUtils_1.llmSupportsVision)(llm)) {
        multiModalMessageContent = await (0, multiModalUtils_1.addImagesToMessages)(nodeData, options, llm.multiModalOption);
        if (multiModalMessageContent?.length) {
            const msg = prompts_1.HumanMessagePromptTemplate.fromTemplate([...multiModalMessageContent]);
            prompt.promptMessages.splice(index, 0, msg);
        }
    }
    return { prompt, multiModalMessageContent };
};
class RouteTool extends tools_1.StructuredTool {
    constructor(fields) {
        super();
        this.name = routerToolName;
        this.description = 'Select the worker to act next';
        this.schema = fields.schema;
    }
    async _call(input) {
        return JSON.stringify(input);
    }
}
module.exports = { nodeClass: Supervisor_MultiAgents };
//# sourceMappingURL=Supervisor.js.map