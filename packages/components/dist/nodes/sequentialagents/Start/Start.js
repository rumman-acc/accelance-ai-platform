"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const langgraph_1 = require("@langchain/langgraph");
class Start_SeqAgents {
    constructor() {
        this.label = 'Start';
        this.name = 'seqStart';
        this.version = 2.0;
        this.type = 'Start';
        this.icon = 'start.svg';
        this.category = 'Sequential Agents';
        this.description = 'Starting point of the conversation';
        this.baseClasses = [this.type];
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-1.-start-node';
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                description: `Only compatible with models that are capable of function calling: ChatOpenAI, ChatMistral, ChatAnthropic, ChatGoogleGenerativeAI, ChatVertexAI, GroqChat`
            },
            {
                label: 'Agent Memory',
                name: 'agentMemory',
                type: 'BaseCheckpointSaver',
                description: 'Save the state of the agent',
                optional: true
            },
            {
                label: 'State',
                name: 'state',
                type: 'State',
                description: 'State is an object that is updated by nodes in the graph, passing from one node to another. By default, state contains "messages" that got updated with each message sent and received.',
                optional: true
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
    async init(nodeData) {
        const moderations = nodeData.inputs?.inputModeration ?? [];
        const model = nodeData.inputs?.model;
        const returnOutput = {
            id: nodeData.id,
            node: langgraph_1.START,
            name: langgraph_1.START,
            label: langgraph_1.START,
            type: 'start',
            output: langgraph_1.START,
            llm: model,
            startLLM: model,
            moderations,
            checkpointMemory: nodeData.inputs?.agentMemory
        };
        return returnOutput;
    }
}
module.exports = { nodeClass: Start_SeqAgents };
//# sourceMappingURL=Start.js.map