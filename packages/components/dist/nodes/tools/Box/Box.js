'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Box_Tools {
    constructor() {
        this.label = 'Box'
        this.name = 'boxTool'
        this.version = 1.0
        this.type = 'Box'
        this.icon = 'box.svg'
        this.category = 'Tools'
        this.description = 'Manage files and folders in Box'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['boxApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Folder Items',
                        name: 'list_folder_items'
                    },
                    {
                        label: 'Create Folder',
                        name: 'create_folder'
                    },
                    {
                        label: 'Get File Info',
                        name: 'get_file_info'
                    },
                    {
                        label: 'Delete File',
                        name: 'delete_file'
                    },
                    {
                        label: 'Search',
                        name: 'search'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData)
        if (!accessToken) {
            throw new Error('No Box access token provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createBoxTools)({
            actions,
            accessToken
        })
        return tools
    }
}
module.exports = { nodeClass: Box_Tools }
//# sourceMappingURL=Box.js.map
