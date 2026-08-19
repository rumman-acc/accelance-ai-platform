'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Amplitude_Tools {
    constructor() {
        this.label = 'Amplitude'
        this.name = 'amplitudeTool'
        this.version = 1.0
        this.type = 'Amplitude'
        this.icon = 'amplitude.svg'
        this.category = 'Tools'
        this.description = 'Send analytics events to Amplitude'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['amplitudeApi']
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
                        label: 'Identify User',
                        name: 'identify_user'
                    },
                    {
                        label: 'Batch Track Events',
                        name: 'batch_track_events'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData)
        const secretKey = (0, utils_1.getCredentialParam)('secretKey', credentialData, nodeData)
        if (!apiKey) {
            throw new Error('No Amplitude API Key provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createAmplitudeTools)({
            actions,
            apiKey,
            secretKey
        })
        return tools
    }
}
module.exports = { nodeClass: Amplitude_Tools }
//# sourceMappingURL=Amplitude.js.map
