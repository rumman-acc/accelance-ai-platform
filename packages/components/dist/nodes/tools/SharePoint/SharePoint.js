'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class SharePoint_Tools {
    constructor() {
        this.label = 'SharePoint'
        this.name = 'sharePointTool'
        this.version = 1.0
        this.type = 'SharePoint'
        this.icon = 'sharepoint.svg'
        this.category = 'Tools'
        this.description = 'Manage SharePoint sites, lists, and files'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['sharePointOAuth2']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Get Site',
                        name: 'get_site'
                    },
                    {
                        label: 'List Lists',
                        name: 'list_lists'
                    },
                    {
                        label: 'List List Items',
                        name: 'list_list_items'
                    },
                    {
                        label: 'Create List Item',
                        name: 'create_list_item'
                    },
                    {
                        label: 'List Drive Items',
                        name: 'list_drive_items'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        let credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        credentialData = await (0, utils_1.refreshOAuth2Token)(nodeData.credential ?? '', credentialData, options)
        const accessToken = (0, utils_1.getCredentialParam)('access_token', credentialData, nodeData)
        if (!accessToken) {
            throw new Error('No access token found in credential')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createSharePointTools)({
            actions,
            accessToken
        })
        return tools
    }
}
module.exports = { nodeClass: SharePoint_Tools }
//# sourceMappingURL=SharePoint.js.map
