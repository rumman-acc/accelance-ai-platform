'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Mailchimp_Tools {
    constructor() {
        this.label = 'Mailchimp'
        this.name = 'mailchimpTool'
        this.version = 1.0
        this.type = 'Mailchimp'
        this.icon = 'mailchimp.svg'
        this.category = 'Tools'
        this.description = 'Manage Mailchimp audiences and campaigns'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mailchimpApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Audiences',
                        name: 'list_audiences'
                    },
                    {
                        label: 'Add List Member',
                        name: 'add_list_member'
                    },
                    {
                        label: 'Get List Member',
                        name: 'get_list_member'
                    },
                    {
                        label: 'List Campaigns',
                        name: 'list_campaigns'
                    },
                    {
                        label: 'Create Campaign',
                        name: 'create_campaign'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData)
        if (!apiKey) {
            throw new Error('No Mailchimp API Key provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const defaultParams = {}
        const authConfig = {
            apiKey
        }
        const tools = (0, core_1.createMailchimpTools)({
            actions,
            apiKey,
            defaultParams,
            authConfig
        })
        return tools
    }
}
module.exports = { nodeClass: Mailchimp_Tools }
//# sourceMappingURL=Mailchimp.js.map
