'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createGitLabTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to manage GitLab projects, issues, and merge requests via the GitLab API`
// Define schemas for different GitLab operations
const ListProjectsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of projects to return')
})
const CreateIssueSchema = v3_1.z.object({
    projectId: v3_1.z.string().describe('numeric project ID or URL-encoded path, e.g. group%2Fproject'),
    title: v3_1.z.string().describe('Issue title'),
    description: v3_1.z.string().optional().describe('Issue description')
})
const ListIssuesSchema = v3_1.z.object({
    projectId: v3_1.z.string().describe('numeric project ID or URL-encoded path, e.g. group%2Fproject'),
    state: v3_1.z.string().optional().default('opened').describe('opened, closed, or all')
})
const GetMergeRequestSchema = v3_1.z.object({
    projectId: v3_1.z.string().describe('numeric project ID or URL-encoded path, e.g. group%2Fproject'),
    mrIid: v3_1.z.string().describe('Internal ID (IID) of the merge request')
})
const CreateMergeRequestSchema = v3_1.z.object({
    projectId: v3_1.z.string().describe('numeric project ID or URL-encoded path, e.g. group%2Fproject'),
    sourceBranch: v3_1.z.string().describe('Source branch for the merge request'),
    targetBranch: v3_1.z.string().describe('Target branch for the merge request'),
    title: v3_1.z.string().describe('Merge request title')
})
class BaseGitLabTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.instanceUrl = ''
        this.personalAccessToken = ''
        this.instanceUrl = args.instanceUrl ?? ''
        this.personalAccessToken = args.personalAccessToken ?? ''
        this.authConfig = args.authConfig
    }
    async makeGitLabRequest({ endpoint, method = 'GET', body, params }) {
        const instanceUrl = this.instanceUrl.replace(/\/$/, '')
        const url = `${instanceUrl}/api/v4${endpoint}`
        const personalAccessToken = this.authConfig?.personalAccessToken ?? this.personalAccessToken
        const headers = {
            'PRIVATE-TOKEN': personalAccessToken,
            'Content-Type': 'application/json',
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`GitLab API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListProjectsTool extends BaseGitLabTool {
    constructor(args) {
        const toolInput = {
            name: 'list_projects',
            description: 'List GitLab projects that the authenticated user is a member of',
            schema: ListProjectsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const endpoint = `/projects?membership=true&per_page=${params.limit}`
            const response = await this.makeGitLabRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing projects: ${error}`, params)
        }
    }
}
class CreateIssueTool extends BaseGitLabTool {
    constructor(args) {
        const toolInput = {
            name: 'create_issue',
            description: 'Create a new issue in a GitLab project',
            schema: CreateIssueSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const body = {
                title: params.title,
                description: params.description
            }
            const endpoint = `/projects/${params.projectId}/issues`
            const response = await this.makeGitLabRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating issue: ${error}`, params)
        }
    }
}
class ListIssuesTool extends BaseGitLabTool {
    constructor(args) {
        const toolInput = {
            name: 'list_issues',
            description: 'List issues for a GitLab project',
            schema: ListIssuesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const endpoint = `/projects/${params.projectId}/issues?state=${params.state}`
            const response = await this.makeGitLabRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing issues: ${error}`, params)
        }
    }
}
class GetMergeRequestTool extends BaseGitLabTool {
    constructor(args) {
        const toolInput = {
            name: 'get_merge_request',
            description: 'Get a specific merge request from a GitLab project',
            schema: GetMergeRequestSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const endpoint = `/projects/${params.projectId}/merge_requests/${params.mrIid}`
            const response = await this.makeGitLabRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting merge request: ${error}`, params)
        }
    }
}
class CreateMergeRequestTool extends BaseGitLabTool {
    constructor(args) {
        const toolInput = {
            name: 'create_merge_request',
            description: 'Create a new merge request in a GitLab project',
            schema: CreateMergeRequestSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const body = {
                source_branch: params.sourceBranch,
                target_branch: params.targetBranch,
                title: params.title
            }
            const endpoint = `/projects/${params.projectId}/merge_requests`
            const response = await this.makeGitLabRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating merge request: ${error}`, params)
        }
    }
}
const createGitLabTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const instanceUrl = args?.instanceUrl || ''
    const personalAccessToken = args?.personalAccessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const authConfig = args?.authConfig
    if (actions.includes('list_projects')) {
        tools.push(
            new ListProjectsTool({
                instanceUrl,
                personalAccessToken,
                maxOutputLength,
                authConfig
            })
        )
    }
    if (actions.includes('create_issue')) {
        tools.push(
            new CreateIssueTool({
                instanceUrl,
                personalAccessToken,
                maxOutputLength,
                authConfig
            })
        )
    }
    if (actions.includes('list_issues')) {
        tools.push(
            new ListIssuesTool({
                instanceUrl,
                personalAccessToken,
                maxOutputLength,
                authConfig
            })
        )
    }
    if (actions.includes('get_merge_request')) {
        tools.push(
            new GetMergeRequestTool({
                instanceUrl,
                personalAccessToken,
                maxOutputLength,
                authConfig
            })
        )
    }
    if (actions.includes('create_merge_request')) {
        tools.push(
            new CreateMergeRequestTool({
                instanceUrl,
                personalAccessToken,
                maxOutputLength,
                authConfig
            })
        )
    }
    return tools
}
exports.createGitLabTools = createGitLabTools
//# sourceMappingURL=core.js.map
