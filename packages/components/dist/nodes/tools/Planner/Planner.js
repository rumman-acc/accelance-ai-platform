'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Planner_Tools {
    constructor() {
        this.label = 'Microsoft Planner'
        this.name = 'plannerTool'
        this.version = 1.0
        this.type = 'Planner'
        this.icon = 'planner.svg'
        this.category = 'Tools'
        this.description = 'Manage Microsoft Planner plans and tasks'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['plannerOAuth2']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Plans for Group',
                        name: 'list_plans_for_group'
                    },
                    {
                        label: 'List Tasks',
                        name: 'list_tasks'
                    },
                    {
                        label: 'Create Task',
                        name: 'create_task'
                    },
                    {
                        label: 'Get Task',
                        name: 'get_task'
                    },
                    {
                        label: 'Update Task',
                        name: 'update_task'
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
        const tools = (0, core_1.createPlannerTools)({
            actions,
            accessToken
        })
        return tools
    }
}
module.exports = { nodeClass: Planner_Tools }
//# sourceMappingURL=Planner.js.map
