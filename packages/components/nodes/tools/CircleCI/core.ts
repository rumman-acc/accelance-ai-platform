import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to trigger and inspect CircleCI pipelines and workflows`

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
    defaultParams?: any
}

const CIRCLECI_BASE_URL = 'https://circleci.com/api/v2'

// Schemas for CircleCI operations
const ListPipelinesSchema = z.object({
    projectSlug: z.string().describe('e.g. gh/org-name/repo-name')
})

const TriggerPipelineSchema = z.object({
    projectSlug: z.string().describe('e.g. gh/org-name/repo-name'),
    branch: z.string().describe('Branch to trigger the pipeline on')
})

const GetPipelineSchema = z.object({
    pipelineId: z.string().describe('ID of the pipeline')
})

const ListWorkflowsSchema = z.object({
    pipelineId: z.string().describe('ID of the pipeline')
})

const GetWorkflowSchema = z.object({
    workflowId: z.string().describe('ID of the workflow')
})

class BaseCircleCITool extends DynamicStructuredTool {
    protected apiToken: string = ''

    constructor(args: any) {
        super(args)
        this.apiToken = args.apiToken ?? ''
    }

    async makeCircleCIRequest({
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
        const url = `${CIRCLECI_BASE_URL}${endpoint}`

        const headers = {
            'Circle-Token': this.apiToken,
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
            throw new Error(`CircleCI API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListPipelinesTool extends BaseCircleCITool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_pipelines',
            description: 'List pipelines for a CircleCI project',
            schema: ListPipelinesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/project/${params.projectSlug}/pipeline`
            const response = await this.makeCircleCIRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing pipelines: ${error}`, params)
        }
    }
}

class TriggerPipelineTool extends BaseCircleCITool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'trigger_pipeline',
            description: 'Trigger a new pipeline for a CircleCI project',
            schema: TriggerPipelineSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/project/${params.projectSlug}/pipeline`
            const body = { branch: params.branch }
            const response = await this.makeCircleCIRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error triggering pipeline: ${error}`, params)
        }
    }
}

class GetPipelineTool extends BaseCircleCITool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_pipeline',
            description: 'Get a specific pipeline from CircleCI',
            schema: GetPipelineSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/pipeline/${params.pipelineId}`
            const response = await this.makeCircleCIRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting pipeline: ${error}`, params)
        }
    }
}

class ListWorkflowsTool extends BaseCircleCITool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_workflows',
            description: 'List workflows for a CircleCI pipeline',
            schema: ListWorkflowsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/pipeline/${params.pipelineId}/workflow`
            const response = await this.makeCircleCIRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing workflows: ${error}`, params)
        }
    }
}

class GetWorkflowTool extends BaseCircleCITool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_workflow',
            description: 'Get a specific workflow from CircleCI',
            schema: GetWorkflowSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/workflow/${params.workflowId}`
            const response = await this.makeCircleCIRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting workflow: ${error}`, params)
        }
    }
}

export const createCircleCITools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const apiToken = args?.apiToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_pipelines')) {
        tools.push(
            new ListPipelinesTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('trigger_pipeline')) {
        tools.push(
            new TriggerPipelineTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_pipeline')) {
        tools.push(
            new GetPipelineTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_workflows')) {
        tools.push(
            new ListWorkflowsTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_workflow')) {
        tools.push(
            new GetWorkflowTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
