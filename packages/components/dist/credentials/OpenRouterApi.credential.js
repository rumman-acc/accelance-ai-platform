"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OpenRouterAPIAuth {
    constructor() {
        this.label = 'OpenRouter API Key';
        this.name = 'openRouterApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'OpenRouter API Key',
                name: 'openRouterApiKey',
                type: 'password',
                description: 'API Key'
            }
        ];
    }
}
module.exports = { credClass: OpenRouterAPIAuth };
//# sourceMappingURL=OpenRouterApi.credential.js.map