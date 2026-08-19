'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class OneDrive_Tools {
    constructor() {
        this.label = 'OneDrive'
        this.name = 'oneDriveTool'
        this.version = 1.0
        this.type = 'OneDrive'
        this.icon = 'onedrive.svg'
        this.category = 'Tools'
        this.description = 'Manage files and folders in OneDrive'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['oneDriveOAuth2']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Root Items',
                        name: 'list_root_items'
                    },
                    {
                        label: 'List Folder Items',
                        name: 'list_folder_items'
                    },
                    {
                        label: 'Get Item',
                        name: 'get_item'
                    },
                    {
                        label: 'Create Folder',
                        name: 'create_folder'
                    },
                    {
                        label: 'Delete Item',
                        name: 'delete_item'
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
        const tools = (0, core_1.createOneDriveTools)({
            actions,
            accessToken
        })
        return tools
    }
}
module.exports = { nodeClass: OneDrive_Tools }
//# sourceMappingURL=OneDrive.js.map
