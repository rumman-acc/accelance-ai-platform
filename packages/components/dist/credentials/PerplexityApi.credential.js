"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PerplexityApi {
    constructor() {
        this.label = 'Perplexity API';
        this.name = 'perplexityApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://docs.perplexity.ai/docs/getting-started">official guide</a> on how to get API key';
        this.inputs = [
            {
                label: 'Perplexity API Key',
                name: 'perplexityApiKey',
                type: 'password',
                placeholder: '<PERPLEXITY_API_KEY>'
            }
        ];
    }
}
module.exports = { credClass: PerplexityApi };
//# sourceMappingURL=PerplexityApi.credential.js.map