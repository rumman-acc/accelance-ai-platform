"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class ClaudeAgent_Tools {
    constructor() {
        this.label = 'Claude (Sub-Agent)';
        this.name = 'claudeAgentTool';
        this.version = 1.0;
        this.type = 'ClaudeAgent';
        this.icon = 'claudeagent.svg';
        this.category = 'Tools';
        this.description = 'Delegate a step to Claude as a callable sub-agent from within a flow';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['anthropicApi']
        };
        this.inputs = [
            {
                label: 'Model',
                name: 'model',
                type: 'string',
                default: 'claude-sonnet-4-5-20250929',
                description: 'Override with any current Anthropic model ID if this default becomes outdated'
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                default: 1024,
                additionalParams: true,
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const anthropicApiKey = (0, utils_1.getCredentialParam)('anthropicApiKey', credentialData, nodeData);
        if (!anthropicApiKey) {
            throw new Error('No Anthropic API key provided');
        }
        const model = nodeData.inputs?.model || 'claude-sonnet-4-5-20250929';
        const maxTokens = nodeData.inputs?.maxTokens || 1024;
        const tools = (0, core_1.createClaudeAgentTools)({
            model,
            maxTokens,
            apiKey: anthropicApiKey
        });
        return tools;
    }
}
module.exports = { nodeClass: ClaudeAgent_Tools };
//# sourceMappingURL=ClaudeAgent.js.map