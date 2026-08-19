'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Vercel_Tools {
    constructor() {
        this.label = 'Vercel'
        this.name = 'vercelTool'
        this.version = 1.0
        this.type = 'Vercel'
        this.icon = 'vercel.svg'
        this.category = 'Tools'
        this.description = 'Manage Vercel deployments and projects'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['vercelApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Deployments',
                        name: 'list_deployments'
                    },
                    {
                        label: 'Get Deployment',
                        name: 'get_deployment'
                    },
                    {
                        label: 'List Projects',
                        name: 'list_projects'
                    },
                    {
                        label: 'Create Deployment',
                        name: 'create_deployment'
                    },
                    {
                        label: 'Delete Deployment',
                        name: 'delete_deployment'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const apiToken = (0, utils_1.getCredentialParam)('apiToken', credentialData, nodeData)
        const teamId = (0, utils_1.getCredentialParam)('teamId', credentialData, nodeData)
        if (!apiToken) {
            throw new Error('No Vercel API token provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createVercelTools)({
            actions,
            apiToken,
            teamId
        })
        return tools
    }
}
module.exports = { nodeClass: Vercel_Tools }
//# sourceMappingURL=Vercel.js.map
