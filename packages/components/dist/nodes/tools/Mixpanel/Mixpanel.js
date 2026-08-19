'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Mixpanel_Tools {
    constructor() {
        this.label = 'Mixpanel'
        this.name = 'mixpanelTool'
        this.version = 1.0
        this.type = 'Mixpanel'
        this.icon = 'mixpanel.svg'
        this.category = 'Tools'
        this.description = 'Send analytics events to Mixpanel'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mixpanelApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Track Event',
                        name: 'track_event'
                    },
                    {
                        label: 'Set User Profile',
                        name: 'set_user_profile'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const projectToken = (0, utils_1.getCredentialParam)('projectToken', credentialData, nodeData)
        if (!projectToken) {
            throw new Error('No Mixpanel Project Token provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createMixpanelTools)({
            actions,
            projectToken
        })
        return tools
    }
}
module.exports = { nodeClass: Mixpanel_Tools }
//# sourceMappingURL=Mixpanel.js.map
