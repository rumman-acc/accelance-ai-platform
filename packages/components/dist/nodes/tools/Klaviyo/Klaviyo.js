'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Klaviyo_Tools {
    constructor() {
        this.label = 'Klaviyo'
        this.name = 'klaviyoTool'
        this.version = 1.0
        this.type = 'Klaviyo'
        this.icon = 'klaviyo.svg'
        this.category = 'Tools'
        this.description = 'Manage Klaviyo profiles and lists'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['klaviyoApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Profiles',
                        name: 'list_profiles'
                    },
                    {
                        label: 'Create Profile',
                        name: 'create_profile'
                    },
                    {
                        label: 'Get Profile',
                        name: 'get_profile'
                    },
                    {
                        label: 'List Lists',
                        name: 'list_lists'
                    },
                    {
                        label: 'Subscribe Profile to List',
                        name: 'subscribe_profile_to_list'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const privateApiKey = (0, utils_1.getCredentialParam)('privateApiKey', credentialData, nodeData)
        if (!privateApiKey) {
            throw new Error('No Klaviyo private API key provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createKlaviyoTools)({
            actions,
            privateApiKey
        })
        return tools
    }
}
module.exports = { nodeClass: Klaviyo_Tools }
//# sourceMappingURL=Klaviyo.js.map
