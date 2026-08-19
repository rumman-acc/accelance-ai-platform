'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class ServiceNow_Tools {
    constructor() {
        this.label = 'ServiceNow'
        this.name = 'serviceNowTool'
        this.version = 1.0
        this.type = 'ServiceNow'
        this.icon = 'servicenow.svg'
        this.category = 'Tools'
        this.description = 'Query and manage ServiceNow records via the Table API'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['serviceNowApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Query Table',
                        name: 'query_table'
                    },
                    {
                        label: 'Get Record',
                        name: 'get_record'
                    },
                    {
                        label: 'Create Record',
                        name: 'create_record'
                    },
                    {
                        label: 'Update Record',
                        name: 'update_record'
                    },
                    {
                        label: 'Delete Record',
                        name: 'delete_record'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const instance = (0, utils_1.getCredentialParam)('instance', credentialData, nodeData)
        const clientId = (0, utils_1.getCredentialParam)('clientId', credentialData, nodeData)
        const clientSecret = (0, utils_1.getCredentialParam)('clientSecret', credentialData, nodeData)
        if (!instance || !clientId || !clientSecret) {
            throw new Error('Invalid credentials: Instance, Client ID, and Client Secret are all required')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createServiceNowTools)({
            actions,
            instance,
            clientId,
            clientSecret
        })
        return tools
    }
}
module.exports = { nodeClass: ServiceNow_Tools }
//# sourceMappingURL=ServiceNow.js.map
