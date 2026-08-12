import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createAzureBlobStorageTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class AzureBlobStorage_Tools implements INode {
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
        this.label = 'Azure Blob Storage'
        this.name = 'azureBlobStorageTool'
        this.version = 1.0
        this.type = 'AzureBlobStorage'
        this.icon = 'azureblobstorage.svg'
        this.category = 'Tools'
        this.description = 'Manage blobs and containers in Azure Blob Storage'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['azureBlobStorageApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Containers',
                        name: 'list_containers'
                    },
                    {
                        label: 'List Blobs',
                        name: 'list_blobs'
                    },
                    {
                        label: 'Get Blob',
                        name: 'get_blob'
                    },
                    {
                        label: 'Upload Blob',
                        name: 'upload_blob'
                    },
                    {
                        label: 'Delete Blob',
                        name: 'delete_blob'
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
        const accountName = getCredentialParam('accountName', credentialData, nodeData)

        if (!tenantId || !clientId || !clientSecret || !accountName) {
            throw new Error('Invalid credentials: Tenant ID, Client ID, Client Secret, and Storage Account Name are all required')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createAzureBlobStorageTools({
            actions,
            tenantId,
            clientId,
            clientSecret,
            accountName
        })

        return tools
    }
}

module.exports = { nodeClass: AzureBlobStorage_Tools }
