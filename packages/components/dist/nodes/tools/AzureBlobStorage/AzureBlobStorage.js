'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class AzureBlobStorage_Tools {
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
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const tenantId = (0, utils_1.getCredentialParam)('tenantId', credentialData, nodeData)
        const clientId = (0, utils_1.getCredentialParam)('clientId', credentialData, nodeData)
        const clientSecret = (0, utils_1.getCredentialParam)('clientSecret', credentialData, nodeData)
        const accountName = (0, utils_1.getCredentialParam)('accountName', credentialData, nodeData)
        if (!tenantId || !clientId || !clientSecret || !accountName) {
            throw new Error('Invalid credentials: Tenant ID, Client ID, Client Secret, and Storage Account Name are all required')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createAzureBlobStorageTools)({
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
//# sourceMappingURL=AzureBlobStorage.js.map
