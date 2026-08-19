"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClaudeAgentTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this to delegate a step to Claude as a callable sub-agent from within a flow`;
const AskClaudeSchema = v3_1.z.object({
    prompt: v3_1.z.string().describe('The question or task to send to Claude'),
    systemPrompt: v3_1.z.string().optional().describe('Optional system prompt to set context/persona')
});
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';
class BaseClaudeAgentTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.model = 'claude-sonnet-4-5-20250929';
        this.maxTokens = 1024;
        this.apiKey = '';
        this.model = args.model ?? this.model;
        this.maxTokens = args.maxTokens ?? this.maxTokens;
        this.apiKey = args.apiKey ?? '';
    }
    async makeClaudeRequest({ body, params }) {
        const url = `${ANTHROPIC_BASE_URL}/messages`;
        const headers = {
            'x-api-key': this.apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'Content-Type': 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        const content = Array.isArray(data?.content) ? data.content : [];
        const text = content
            .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
            .map((block) => block.text)
            .join('');
        return text + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class AskClaudeTool extends BaseClaudeAgentTool {
    constructor(args) {
        const toolInput = {
            name: 'ask_claude',
            description: 'Delegate a step to Claude as a callable sub-agent from within a flow',
            schema: AskClaudeSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            model: args.model,
            maxTokens: args.maxTokens,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const body = {
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [{ role: 'user', content: params.prompt }],
                ...(params.systemPrompt ? { system: params.systemPrompt } : {})
            };
            const response = await this.makeClaudeRequest({ body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error calling Claude: ${error}`, params);
        }
    }
}
const createClaudeAgentTools = (args) => {
    const tools = [];
    const model = args?.model || 'claude-sonnet-4-5-20250929';
    const maxTokens = args?.maxTokens || 1024;
    const apiKey = args?.apiKey || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    tools.push(new AskClaudeTool({
        model,
        maxTokens,
        apiKey,
        maxOutputLength
    }));
    return tools;
};
exports.createClaudeAgentTools = createClaudeAgentTools;
//# sourceMappingURL=core.js.map