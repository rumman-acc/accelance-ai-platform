"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AzureRerankerApi {
    constructor() {
        this.label = 'Azure Foundry API';
        this.name = 'azureFoundryApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://docs.microsoft.com/en-us/azure/ai-foundry/">Azure AI Foundry documentation</a> for setup instructions';
        this.inputs = [
            {
                label: 'Azure Foundry API Key',
                name: 'azureFoundryApiKey',
                type: 'password',
                description: 'Your Azure AI Foundry API key'
            },
            {
                label: 'Azure Foundry Endpoint',
                name: 'azureFoundryEndpoint',
                type: 'string',
                placeholder: 'https://your-foundry-instance.services.ai.azure.com/providers/cohere/v2/rerank',
                description: 'Your Azure AI Foundry endpoint URL'
            }
        ];
    }
}
module.exports = { credClass: AzureRerankerApi };
//# sourceMappingURL=AzureRerankerApi.credential.js.map