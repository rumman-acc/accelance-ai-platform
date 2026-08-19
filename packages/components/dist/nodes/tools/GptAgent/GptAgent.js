"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class GptAgent_Tools {
    constructor() {
        this.label = 'GPT (Sub-Agent)';
        this.name = 'gptAgentTool';
        this.version = 1.0;
        this.type = 'GptAgent';
        this.icon = 'gptagent.svg';
        this.category = 'Tools';
        this.description = 'Delegate a step to GPT as a callable sub-agent from within a flow';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['openAIApi']
        };
        this.inputs = [
            {
                label: 'Model',
                name: 'model',
                type: 'string',
                default: 'gpt-4o',
                description: 'Override with any current OpenAI model ID if this default becomes outdated'
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const openAIApiKey = (0, utils_1.getCredentialParam)('openAIApiKey', credentialData, nodeData);
        if (!openAIApiKey) {
            throw new Error('No OpenAI API key provided');
        }
        const model = nodeData.inputs?.model || 'gpt-4o';
        const tools = (0, core_1.createGptAgentTools)({
            model,
            apiKey: openAIApiKey
        });
        return tools;
    }
}
module.exports = { nodeClass: GptAgent_Tools };
//# sourceMappingURL=GptAgent.js.map