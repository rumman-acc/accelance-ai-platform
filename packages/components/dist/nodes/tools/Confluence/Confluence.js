'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Confluence_Tools {
    constructor() {
        this.label = 'Confluence'
        this.name = 'confluenceTool'
        this.version = 1.0
        this.type = 'Confluence'
        this.icon = 'confluence.svg'
        this.category = 'Tools'
        this.description = 'Manage Confluence spaces and pages'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['confluenceCloudApi']
        }
        this.inputs = [
            {
                label: 'Site URL',
                name: 'siteUrl',
                type: 'string',
                placeholder: 'https://yourcompany.atlassian.net'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Spaces',
                        name: 'list_spaces'
                    },
                    {
                        label: 'Get Page',
                        name: 'get_page'
                    },
                    {
                        label: 'Create Page',
                        name: 'create_page'
                    },
                    {
                        label: 'Update Page',
                        name: 'update_page'
                    },
                    {
                        label: 'Search Content',
                        name: 'search_content'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const siteUrl = nodeData.inputs?.siteUrl
        if (!siteUrl) {
            throw new Error('No Confluence site URL provided')
        }
        const username = (0, utils_1.getCredentialParam)('username', credentialData, nodeData)
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData)
        if (!username || !accessToken) {
            throw new Error('Invalid credentials: provide both Username and Access Token')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createConfluenceTools)({
            actions,
            siteUrl,
            username,
            accessToken
        })
        return tools
    }
}
module.exports = { nodeClass: Confluence_Tools }
//# sourceMappingURL=Confluence.js.map
