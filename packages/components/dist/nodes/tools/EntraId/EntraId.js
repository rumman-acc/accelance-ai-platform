'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class EntraId_Tools {
    constructor() {
        this.label = 'Microsoft Entra ID'
        this.name = 'entraIdTool'
        this.version = 1.0
        this.type = 'EntraId'
        this.icon = 'entraid.svg'
        this.category = 'Tools'
        this.description = 'Manage Entra ID (Azure AD) users and groups'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['entraIdApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Users',
                        name: 'list_users'
                    },
                    {
                        label: 'Get User',
                        name: 'get_user'
                    },
                    {
                        label: 'Create User',
                        name: 'create_user'
                    },
                    {
                        label: 'List Groups',
                        name: 'list_groups'
                    },
                    {
                        label: 'Add User To Group',
                        name: 'add_user_to_group'
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
        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Invalid credentials: Tenant ID, Client ID, and Client Secret are all required')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createEntraIdTools)({
            actions,
            tenantId,
            clientId,
            clientSecret
        })
        return tools
    }
}
module.exports = { nodeClass: EntraId_Tools }
//# sourceMappingURL=EntraId.js.map
