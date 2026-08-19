'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Segment_Tools {
    constructor() {
        this.label = 'Segment'
        this.name = 'segmentTool'
        this.version = 1.0
        this.type = 'Segment'
        this.icon = 'segment.svg'
        this.category = 'Tools'
        this.description = 'Send analytics events to Segment'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['segmentApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Track',
                        name: 'track'
                    },
                    {
                        label: 'Identify',
                        name: 'identify'
                    },
                    {
                        label: 'Page',
                        name: 'page'
                    },
                    {
                        label: 'Group',
                        name: 'group'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const writeKey = (0, utils_1.getCredentialParam)('writeKey', credentialData, nodeData)
        if (!writeKey) {
            throw new Error('No Segment write key provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createSegmentTools)({
            actions,
            writeKey
        })
        return tools
    }
}
module.exports = { nodeClass: Segment_Tools }
//# sourceMappingURL=Segment.js.map
