import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Azure DevOps API for managing projects, work items, and repositories`

export interface Headers {
    [key: string]: string
}

export interface Body {
    [key: string]: any
}

export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    organization?: string
    personalAccessToken?: string
    defaultParams?: any
}

// Define schemas for different Azure DevOps operations

const ListProjectsSchema = z.object({})

const QueryWorkItemsSchema = z.object({
    project: z.string(),
    wiql: z.string().describe('WIQL query, e.g. "SELECT [System.Id] FROM WorkItems WHERE [System.State] = \'Active\'"')
})

const CreateWorkItemSchema = z.object({
    project: z.string(),
    workItemType: z.string().describe('e.g. Task, Bug, User Story'),
    title: z.string()
})

const GetWorkItemSchema = z.object({
    project: z.string(),
    workItemId: z.string()
})

const ListRepositoriesSchema = z.object({
    project: z.string()
})

class BaseAzureDevOpsTool extends DynamicStructuredTool {
    protected organization: string = ''
    protected personalAccessToken: string = ''

    constructor(args: any) {
        super(args)
        this.organization = args.organization ?? ''
        this.personalAccessToken = args.personalAccessToken ?? ''
    }

    async makeAzureDevOpsRequest({
        endpoint,
        method = 'GET',
        body,
        contentType = 'application/json',
        params
    }: {
        endpoint: string
        method?: string
        body?: any
        contentType?: string
        params?: any
    }): Promise<string> {
        const separator = endpoint.includes('?') ? '&' : '?'
        const url = `https://dev.azure.com/${this.organization}${endpoint}${separator}api-version=7.1`

        const authHeader = `Basic ${Buffer.from(':' + this.personalAccessToken).toString('base64')}`

        const headers = {
            Authorization: authHeader,
            'Content-Type': contentType,
            Accept: 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Azure DevOps API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListProjectsTool extends BaseAzureDevOpsTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_projects',
            description: 'List all projects in the Azure DevOps organization',
            schema: ListProjectsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/_apis/projects`
            const response = await this.makeAzureDevOpsRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing projects: ${error}`, params)
        }
    }
}

class QueryWorkItemsTool extends BaseAzureDevOpsTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'query_work_items',
            description: 'Query work items in Azure DevOps using WIQL',
            schema: QueryWorkItemsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.project}/_apis/wit/wiql`
            const body = { query: params.wiql }
            const response = await this.makeAzureDevOpsRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error querying work items: ${error}`, params)
        }
    }
}

class CreateWorkItemTool extends BaseAzureDevOpsTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_work_item',
            description: 'Create a new work item in Azure DevOps',
            schema: CreateWorkItemSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        }
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.project}/_apis/wit/workitems/$${params.workItemType}`
            const body = [{ op: 'add', path: '/fields/System.Title', value: params.title }]
            const response = await this.makeAzureDevOpsRequest({
                endpoint,
                method: 'PATCH',
                body,
                contentType: 'application/json-patch+json',
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error creating work item: ${error}`, params)
        }
    }
}

class GetWorkItemTool extends BaseAzureDevOpsTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_work_item',
            description: 'Get a specific work item from Azure DevOps',
            schema: GetWorkItemSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.project}/_apis/wit/workitems/${params.workItemId}`
            const response = await this.makeAzureDevOpsRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting work item: ${error}`, params)
        }
    }
}

class ListRepositoriesTool extends BaseAzureDevOpsTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_repositories',
            description: 'List Git repositories in an Azure DevOps project',
            schema: ListRepositoriesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.project}/_apis/git/repositories`
            const response = await this.makeAzureDevOpsRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing repositories: ${error}`, params)
        }
    }
}

export const createAzureDevOpsTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const organization = args?.organization || ''
    const personalAccessToken = args?.personalAccessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_projects')) {
        tools.push(
            new ListProjectsTool({
                organization,
                personalAccessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('query_work_items')) {
        tools.push(
            new QueryWorkItemsTool({
                organization,
                personalAccessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_work_item')) {
        tools.push(
            new CreateWorkItemTool({
                organization,
                personalAccessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_work_item')) {
        tools.push(
            new GetWorkItemTool({
                organization,
                personalAccessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_repositories')) {
        tools.push(
            new ListRepositoriesTool({
                organization,
                personalAccessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
