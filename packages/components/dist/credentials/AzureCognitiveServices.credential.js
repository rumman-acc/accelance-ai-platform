"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AzureCognitiveServices {
    constructor() {
        this.label = 'Azure Cognitive Services';
        this.name = 'azureCognitiveServices';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Azure Subscription Key',
                name: 'azureSubscriptionKey',
                type: 'password',
                description: 'Your Azure Cognitive Services subscription key'
            },
            {
                label: 'Service Region',
                name: 'serviceRegion',
                type: 'string',
                description: 'The Azure service region (e.g., "westus", "eastus")',
                placeholder: 'westus'
            },
            {
                label: 'API Version',
                name: 'apiVersion',
                type: 'string',
                description: 'The API version to use (e.g., "2024-05-15-preview")',
                placeholder: '2024-05-15-preview',
                default: '2024-05-15-preview'
            }
        ];
    }
}
module.exports = { credClass: AzureCognitiveServices };
//# sourceMappingURL=AzureCognitiveServices.credential.js.map