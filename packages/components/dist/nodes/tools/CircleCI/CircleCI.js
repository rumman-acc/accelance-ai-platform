'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class CircleCI_Tools {
    constructor() {
        this.label = 'CircleCI'
        this.name = 'circleciTool'
        this.version = 1.0
        this.type = 'CircleCI'
        this.icon = 'circleci.svg'
        this.category = 'Tools'
        this.description = 'Trigger and inspect CircleCI pipelines'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['circleciApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Pipelines',
                        name: 'list_pipelines'
                    },
                    {
                        label: 'Trigger Pipeline',
                        name: 'trigger_pipeline'
                    },
                    {
                        label: 'Get Pipeline',
                        name: 'get_pipeline'
                    },
                    {
                        label: 'List Workflows',
                        name: 'list_workflows'
                    },
                    {
                        label: 'Get Workflow',
                        name: 'get_workflow'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const apiToken = (0, utils_1.getCredentialParam)('apiToken', credentialData, nodeData)
        if (!apiToken) {
            throw new Error('No CircleCI API Token provided')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createCircleCITools)({
            actions,
            apiToken
        })
        return tools
    }
}
module.exports = { nodeClass: CircleCI_Tools }
//# sourceMappingURL=CircleCI.js.map
