"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class AzureKeyVault_Tools {
    constructor() {
        this.label = 'Azure Key Vault';
        this.name = 'azureKeyVaultTool';
        this.version = 1.0;
        this.type = 'AzureKeyVault';
        this.icon = 'azurekeyvault.svg';
        this.category = 'Tools';
        this.description = 'Manage secrets and keys in Azure Key Vault';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['azureKeyVaultApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Secrets',
                        name: 'list_secrets'
                    },
                    {
                        label: 'Get Secret',
                        name: 'get_secret'
                    },
                    {
                        label: 'Set Secret',
                        name: 'set_secret'
                    },
                    {
                        label: 'Delete Secret',
                        name: 'delete_secret'
                    },
                    {
                        label: 'List Keys',
                        name: 'list_keys'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const tenantId = (0, utils_1.getCredentialParam)('tenantId', credentialData, nodeData);
        const clientId = (0, utils_1.getCredentialParam)('clientId', credentialData, nodeData);
        const clientSecret = (0, utils_1.getCredentialParam)('clientSecret', credentialData, nodeData);
        const vaultName = (0, utils_1.getCredentialParam)('vaultName', credentialData, nodeData);
        if (!tenantId || !clientId || !clientSecret || !vaultName) {
            throw new Error('Invalid credentials: Tenant ID, Client ID, Client Secret, and Key Vault Name are all required');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createAzureKeyVaultTools)({
            actions,
            tenantId,
            clientId,
            clientSecret,
            vaultName
        });
        return tools;
    }
}
module.exports = { nodeClass: AzureKeyVault_Tools };
//# sourceMappingURL=AzureKeyVault.js.map