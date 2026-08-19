'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Bitbucket_Tools {
    constructor() {
        this.label = 'Bitbucket'
        this.name = 'bitbucketTool'
        this.version = 1.0
        this.type = 'Bitbucket'
        this.icon = 'bitbucket.svg'
        this.category = 'Tools'
        this.description = 'Manage Bitbucket repositories, pull requests, and issues'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['bitbucketApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Repositories',
                        name: 'list_repositories'
                    },
                    {
                        label: 'Get Repository',
                        name: 'get_repository'
                    },
                    {
                        label: 'List Pull Requests',
                        name: 'list_pull_requests'
                    },
                    {
                        label: 'Create Pull Request',
                        name: 'create_pull_request'
                    },
                    {
                        label: 'List Issues',
                        name: 'list_issues'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        let credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const username = (0, utils_1.getCredentialParam)('username', credentialData, nodeData)
        const appPassword = (0, utils_1.getCredentialParam)('appPassword', credentialData, nodeData)
        if (!username || !appPassword) {
            throw new Error('Invalid credentials: provide both Username and App Password')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const authConfig = {
            username,
            appPassword
        }
        const tools = (0, core_1.createBitbucketTools)({
            actions,
            username,
            appPassword,
            authConfig
        })
        return tools
    }
}
module.exports = { nodeClass: Bitbucket_Tools }
//# sourceMappingURL=Bitbucket.js.map
