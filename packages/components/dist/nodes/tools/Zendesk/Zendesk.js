'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Zendesk_Tools {
    constructor() {
        this.label = 'Zendesk'
        this.name = 'zendeskTool'
        this.version = 1.0
        this.type = 'Zendesk'
        this.icon = 'zendesk.svg'
        this.category = 'Tools'
        this.description = 'Manage Zendesk support tickets'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['zendeskApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Tickets',
                        name: 'list_tickets'
                    },
                    {
                        label: 'Create Ticket',
                        name: 'create_ticket'
                    },
                    {
                        label: 'Get Ticket',
                        name: 'get_ticket'
                    },
                    {
                        label: 'Update Ticket',
                        name: 'update_ticket'
                    },
                    {
                        label: 'Search Tickets',
                        name: 'search_tickets'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const subdomain = (0, utils_1.getCredentialParam)('subdomain', credentialData, nodeData)
        const email = (0, utils_1.getCredentialParam)('email', credentialData, nodeData)
        const apiToken = (0, utils_1.getCredentialParam)('apiToken', credentialData, nodeData)
        if (!subdomain || !email || !apiToken) {
            throw new Error('Invalid credentials: subdomain, email, and API token are required')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createZendeskTools)({
            actions,
            subdomain,
            email,
            apiToken
        })
        return tools
    }
}
module.exports = { nodeClass: Zendesk_Tools }
//# sourceMappingURL=Zendesk.js.map
