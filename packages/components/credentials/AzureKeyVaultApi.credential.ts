import { INodeParams, INodeCredential } from '../src/Interface'

class AzureKeyVaultApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Azure Key Vault API'
        this.name = 'azureKeyVaultApi'
        this.version = 1.0
        this.description =
            'Register an application in Azure AD, then grant it a Key Vault access policy or RBAC role (e.g. "Key Vault Secrets Officer") on the target vault. Use the app registration\'s Tenant ID, Client ID, and a generated Client Secret below.'
        this.inputs = [
            {
                label: 'Tenant ID',
                name: 'tenantId',
                type: 'string',
                placeholder: '<AZURE_TENANT_ID>'
            },
            {
                label: 'Client ID',
                name: 'clientId',
                type: 'string',
                placeholder: '<AZURE_CLIENT_ID>'
            },
            {
                label: 'Client Secret',
                name: 'clientSecret',
                type: 'password',
                placeholder: '<AZURE_CLIENT_SECRET>'
            },
            {
                label: 'Key Vault Name',
                name: 'vaultName',
                type: 'string',
                placeholder: '<AZURE_KEY_VAULT_NAME>'
            }
        ]
    }
}

module.exports = { credClass: AzureKeyVaultApi }
