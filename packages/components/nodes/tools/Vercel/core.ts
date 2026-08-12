import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Vercel API for managing deployments and projects`

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
    apiToken?: string
    teamId?: string
    defaultParams?: any
}

// Define schemas for different Vercel operations
const ListDeploymentsSchema = z.object({
    limit: z.number().optional().default(20).describe('Maximum number of deployments to return')
})

const GetDeploymentSchema = z.object({
    deploymentId: z.string().describe('ID of the deployment to retrieve')
})

const ListProjectsSchema = z.object({})

const CreateDeploymentSchema = z.object({
    name: z.string().describe('Name for the deployment'),
    projectName: z.string().describe('Name of the project to deploy to'),
    target: z.string().optional().default('production').describe('Deployment target environment (e.g. production, staging)')
})

const DeleteDeploymentSchema = z.object({
    deploymentId: z.string().describe('ID of the deployment to delete')
})

class BaseVercelTool extends DynamicStructuredTool {
    protected apiToken: string = ''
    protected teamId: string = ''

    constructor(args: any) {
        super(args)
        this.apiToken = args.apiToken ?? ''
        this.teamId = args.teamId ?? ''
    }

    async makeVercelRequest({
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
        let url = `https://api.vercel.com${endpoint}`

        if (this.teamId) {
            url += url.includes('?') ? `&teamId=${this.teamId}` : `?teamId=${this.teamId}`
        }

        const headers = {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Vercel API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListDeploymentsTool extends BaseVercelTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_deployments',
            description: 'List deployments from Vercel',
            schema: ListDeploymentsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const limit = params.limit ?? 20
            const endpoint = `/v6/deployments?limit=${limit}`
            const response = await this.makeVercelRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing deployments: ${error}`, params)
        }
    }
}

class GetDeploymentTool extends BaseVercelTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_deployment',
            description: 'Get a specific deployment from Vercel',
            schema: GetDeploymentSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/v13/deployments/${params.deploymentId}`
            const response = await this.makeVercelRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting deployment: ${error}`, params)
        }
    }
}

class ListProjectsTool extends BaseVercelTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_projects',
            description: 'List projects from Vercel',
            schema: ListProjectsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/v9/projects`
            const response = await this.makeVercelRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing projects: ${error}`, params)
        }
    }
}

class CreateDeploymentTool extends BaseVercelTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_deployment',
            description: 'Create a new deployment in Vercel',
            schema: CreateDeploymentSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const deploymentData = {
                name: params.name,
                project: params.projectName,
                target: params.target ?? 'production'
            }

            const endpoint = `/v13/deployments`
            const response = await this.makeVercelRequest({ endpoint, method: 'POST', body: deploymentData, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating deployment: ${error}`, params)
        }
    }
}

class DeleteDeploymentTool extends BaseVercelTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'delete_deployment',
            description: 'Delete a deployment from Vercel',
            schema: DeleteDeploymentSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/v13/deployments/${params.deploymentId}`
            const response = await this.makeVercelRequest({ endpoint, method: 'DELETE', params })
            return response || 'Deployment deleted successfully'
        } catch (error) {
            return formatToolError(`Error deleting deployment: ${error}`, params)
        }
    }
}

export const createVercelTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const apiToken = args?.apiToken || ''
    const teamId = args?.teamId || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_deployments')) {
        tools.push(
            new ListDeploymentsTool({
                apiToken,
                teamId,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_deployment')) {
        tools.push(
            new GetDeploymentTool({
                apiToken,
                teamId,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_projects')) {
        tools.push(
            new ListProjectsTool({
                apiToken,
                teamId,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_deployment')) {
        tools.push(
            new CreateDeploymentTool({
                apiToken,
                teamId,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('delete_deployment')) {
        tools.push(
            new DeleteDeploymentTool({
                apiToken,
                teamId,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
