"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGptAgentTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to delegate a question or task to GPT as a callable sub-agent`;
const AskGptSchema = v3_1.z.object({
    prompt: v3_1.z.string().describe('The question or task to send to GPT'),
    systemPrompt: v3_1.z.string().optional().describe('Optional system prompt to set context/persona')
});
class BaseGptAgentTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.model = 'gpt-4o';
        this.apiKey = '';
        this.model = args.model ?? 'gpt-4o';
        this.apiKey = args.apiKey ?? '';
    }
    async makeGptRequest({ body, params }) {
        const url = 'https://api.openai.com/v1/chat/completions';
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content ?? '';
        return answer + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class AskGptTool extends BaseGptAgentTool {
    constructor(args) {
        const toolInput = {
            name: 'ask_gpt',
            description: 'Delegate a question or task to GPT and receive its answer',
            schema: AskGptSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            model: args.model,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const messages = [];
            if (params.systemPrompt) {
                messages.push({ role: 'system', content: params.systemPrompt });
            }
            messages.push({ role: 'user', content: params.prompt });
            const body = {
                model: this.model,
                messages
            };
            const response = await this.makeGptRequest({ body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error asking GPT: ${error}`, params);
        }
    }
}
const createGptAgentTools = (args) => {
    const tools = [];
    const model = args?.model || 'gpt-4o';
    const apiKey = args?.apiKey || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    tools.push(new AskGptTool({
        model,
        apiKey,
        maxOutputLength
    }));
    return tools;
};
exports.createGptAgentTools = createGptAgentTools;
//# sourceMappingURL=core.js.map