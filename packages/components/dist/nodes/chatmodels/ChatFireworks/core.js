"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatFireworks = void 0;
const openai_1 = require("@langchain/openai");
const env_1 = require("@langchain/core/utils/env");
class ChatFireworks extends openai_1.ChatOpenAICompletions {
    static lc_name() {
        return 'ChatFireworks';
    }
    _llmType() {
        return 'fireworks';
    }
    get lc_secrets() {
        return {
            fireworksApiKey: 'FIREWORKS_API_KEY',
            apiKey: 'FIREWORKS_API_KEY'
        };
    }
    constructor(fields) {
        const fireworksApiKey = fields?.apiKey || fields?.fireworksApiKey || (0, env_1.getEnvironmentVariable)('FIREWORKS_API_KEY');
        if (!fireworksApiKey) {
            throw new Error(`Fireworks API key not found. Please set the FIREWORKS_API_KEY environment variable or provide the key into "fireworksApiKey"`);
        }
        super({
            ...fields,
            model: fields?.model || fields?.modelName || 'accounts/fireworks/models/llama-v3p1-8b-instruct',
            apiKey: fireworksApiKey,
            configuration: {
                baseURL: 'https://api.fireworks.ai/inference/v1'
            },
            streamUsage: false
        });
        this.lc_serializable = true;
        this.fireworksApiKey = fireworksApiKey;
        this.apiKey = fireworksApiKey;
    }
    getLsParams(options) {
        const params = super.getLsParams(options);
        params.ls_provider = 'fireworks';
        return params;
    }
    toJSON() {
        const result = super.toJSON();
        if ('kwargs' in result && typeof result.kwargs === 'object' && result.kwargs != null) {
            delete result.kwargs.openai_api_key;
            delete result.kwargs.configuration;
        }
        return result;
    }
    /**
     * Calls the Fireworks API with retry logic in case of failures.
     * @param request The request to send to the Fireworks API.
     * @param options Optional configuration for the API call.
     * @returns The response from the Fireworks API.
     */
    // eslint-disable-next-line
    async completionWithRetry(request, options) {
        delete request.frequency_penalty;
        delete request.presence_penalty;
        delete request.logit_bias;
        delete request.functions;
        if (request.stream === true) {
            return super.completionWithRetry(request, options);
        }
        return super.completionWithRetry(request, options);
    }
}
exports.ChatFireworks = ChatFireworks;
//# sourceMappingURL=core.js.map