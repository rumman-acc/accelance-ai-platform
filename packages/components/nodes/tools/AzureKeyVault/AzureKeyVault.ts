import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createAzureKeyVaultTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class AzureKeyVault_Tools implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Azure Key Vault'
        this.name = 'azureKeyVaultTool'
        this.version = 1.0
        this.type = 'AzureKeyVault'
        this.icon = 'azurekeyvault.svg'
        this.category = 'Tools'
        this.description = 'Manage secrets and keys in Azure Key Vault'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['azureKeyVaultApi']
        }
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
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const tenantId = getCredentialParam('tenantId', credentialData, nodeData)
        const clientId = getCredentialParam('clientId', credentialData, nodeData)
        const clientSecret = getCredentialParam('clientSecret', credentialData, nodeData)
        const vaultName = getCredentialParam('vaultName', credentialData, nodeData)

        if (!tenantId || !clientId || !clientSecret || !vaultName) {
            throw new Error('Invalid credentials: Tenant ID, Client ID, Client Secret, and Key Vault Name are all required')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createAzureKeyVaultTools({
            actions,
            tenantId,
            clientId,
            clientSecret,
            vaultName
        })

        return tools
    }
}

module.exports = { nodeClass: AzureKeyVault_Tools }
