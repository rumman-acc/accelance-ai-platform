'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class AzureDevOps_Tools {
    constructor() {
        this.label = 'Azure DevOps'
        this.name = 'azureDevOpsTool'
        this.version = 1.0
        this.type = 'AzureDevOps'
        this.icon = 'azuredevops.svg'
        this.category = 'Tools'
        this.description = 'Manage Azure DevOps projects, work items, and repositories'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['azureDevOpsApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Projects',
                        name: 'list_projects'
                    },
                    {
                        label: 'Query Work Items',
                        name: 'query_work_items'
                    },
                    {
                        label: 'Create Work Item',
                        name: 'create_work_item'
                    },
                    {
                        label: 'Get Work Item',
                        name: 'get_work_item'
                    },
                    {
                        label: 'List Repositories',
                        name: 'list_repositories'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const organization = (0, utils_1.getCredentialParam)('organization', credentialData, nodeData)
        const personalAccessToken = (0, utils_1.getCredentialParam)('personalAccessToken', credentialData, nodeData)
        if (!organization) {
            throw new Error('No Azure DevOps organization provided')
        }
        if (!personalAccessToken) {
            throw new Error('No Azure DevOps Personal Access Token provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createAzureDevOpsTools)({
            actions,
            organization,
            personalAccessToken
        })
        return tools
    }
}
module.exports = { nodeClass: AzureDevOps_Tools }
//# sourceMappingURL=AzureDevOps.js.map
