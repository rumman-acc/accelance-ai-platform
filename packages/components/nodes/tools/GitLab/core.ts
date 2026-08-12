import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to manage GitLab projects, issues, and merge requests via the GitLab API`

export interface Headers {
    [key: string]: string
}

export interface Body {
    [key: string]: any
}

export interface GitLabAuthConfig {
    personalAccessToken?: string
}

export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    instanceUrl?: string
    personalAccessToken?: string
    authConfig?: GitLabAuthConfig
}

// Define schemas for different GitLab operations

const ListProjectsSchema = z.object({
    limit: z.number().optional().default(20).describe('Maximum number of projects to return')
})

const CreateIssueSchema = z.object({
    projectId: z.string().describe('numeric project ID or URL-encoded path, e.g. group%2Fproject'),
    title: z.string().describe('Issue title'),
    description: z.string().optional().describe('Issue description')
})

const ListIssuesSchema = z.object({
    projectId: z.string().describe('numeric project ID or URL-encoded path, e.g. group%2Fproject'),
    state: z.string().optional().default('opened').describe('opened, closed, or all')
})

const GetMergeRequestSchema = z.object({
    projectId: z.string().describe('numeric project ID or URL-encoded path, e.g. group%2Fproject'),
    mrIid: z.string().describe('Internal ID (IID) of the merge request')
})

const CreateMergeRequestSchema = z.object({
    projectId: z.string().describe('numeric project ID or URL-encoded path, e.g. group%2Fproject'),
    sourceBranch: z.string().describe('Source branch for the merge request'),
    targetBranch: z.string().describe('Target branch for the merge request'),
    title: z.string().describe('Merge request title')
})

class BaseGitLabTool extends DynamicStructuredTool {
    protected instanceUrl: string = ''
    protected personalAccessToken: string = ''
    protected authConfig: GitLabAuthConfig | undefined

    constructor(args: any) {
        super(args)
        this.instanceUrl = args.instanceUrl ?? ''
        this.personalAccessToken = args.personalAccessToken ?? ''
        this.authConfig = args.authConfig
    }

    async makeGitLabRequest({
        endpoint,
        method = 'GET',
        body,
        params
    }: {
        endpoint: string
        method?: string
        body?: any
        params?: any
    }): Promise<string> {
        const instanceUrl = this.instanceUrl.replace(/\/$/, '')
        const url = `${instanceUrl}/api/v4${endpoint}`

        const personalAccessToken = this.authConfig?.personalAccessToken ?? this.personalAccessToken

        const headers = {
            'PRIVATE-TOKEN': personalAccessToken,
            'Content-Type': 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }

        const response = await secureFetch(url, fetchOptions, 5)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`GitLab API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListProjectsTool extends BaseGitLabTool {
    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `/projects?membership=true&per_page=${params.limit}`
            const response = await this.makeGitLabRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing projects: ${error}`, params)
        }
    }
}

class CreateIssueTool extends BaseGitLabTool {
    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const body: Record<string, any> = {
                title: params.title,
                description: params.description
            }

            const endpoint = `/projects/${params.projectId}/issues`
            const response = await this.makeGitLabRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating issue: ${error}`, params)
        }
    }
}

class ListIssuesTool extends BaseGitLabTool {
    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `/projects/${params.projectId}/issues?state=${params.state}`
            const response = await this.makeGitLabRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing issues: ${error}`, params)
        }
    }
}

class GetMergeRequestTool extends BaseGitLabTool {
    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `/projects/${params.projectId}/merge_requests/${params.mrIid}`
            const response = await this.makeGitLabRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting merge request: ${error}`, params)
        }
    }
}

class CreateMergeRequestTool extends BaseGitLabTool {
    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
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
            return formatToolError(`Error creating merge request: ${error}`, params)
        }
    }
}

export const createGitLabTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
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
