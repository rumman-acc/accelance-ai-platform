'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class GitLab_Tools {
    constructor() {
        this.label = 'GitLab'
        this.name = 'gitlabTool'
        this.version = 1.0
        this.type = 'GitLab'
        this.icon = 'gitlab.svg'
        this.category = 'Tools'
        this.description = 'Manage GitLab projects, issues, and merge requests'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['gitlabApi']
        }
        this.inputs = [
            {
                label: 'Instance URL',
                name: 'instanceUrl',
                type: 'string',
                default: 'https://gitlab.com',
                description: 'change for a self-hosted GitLab instance'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Projects',
                        name: 'list_projects'
                    },
                    {
                        label: 'Create Issue',
                        name: 'create_issue'
                    },
                    {
                        label: 'List Issues',
                        name: 'list_issues'
                    },
                    {
                        label: 'Get Merge Request',
                        name: 'get_merge_request'
                    },
                    {
                        label: 'Create Merge Request',
                        name: 'create_merge_request'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const personalAccessToken = (0, utils_1.getCredentialParam)('personalAccessToken', credentialData, nodeData)
        if (!personalAccessToken) {
            throw new Error('Invalid credentials: provide a Personal Access Token')
        }
        const instanceUrl = nodeData.inputs?.instanceUrl || 'https://gitlab.com'
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const authConfig = {
            personalAccessToken
        }
        const tools = (0, core_1.createGitLabTools)({
            actions,
            instanceUrl,
            personalAccessToken,
            authConfig
        })
        return tools
    }
}
module.exports = { nodeClass: GitLab_Tools }
//# sourceMappingURL=GitLab.js.map
