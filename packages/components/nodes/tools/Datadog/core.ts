import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Datadog API for querying metrics and managing monitors`

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
    apiKey?: string
    appKey?: string
    site?: string
    defaultParams?: any
}

// Define schemas for different Datadog operations

const ListMonitorsSchema = z.object({})

const GetMonitorSchema = z.object({
    monitorId: z.string()
})

const CreateMonitorSchema = z.object({
    query: z.string().describe('Datadog monitor query, e.g. "avg(last_5m):avg:system.cpu.user{*} > 80"'),
    name: z.string(),
    message: z.string()
})

const PostEventSchema = z.object({
    title: z.string(),
    text: z.string()
})

const QueryMetricsSchema = z.object({
    from: z.number().describe('Unix timestamp, start of range'),
    to: z.number().describe('Unix timestamp, end of range'),
    query: z.string().describe('Datadog metric query, e.g. "avg:system.cpu.user{*}"')
})

class BaseDatadogTool extends DynamicStructuredTool {
    protected apiKey: string = ''
    protected appKey: string = ''
    protected site: string = ''

    constructor(args: any) {
        super(args)
        this.apiKey = args.apiKey ?? ''
        this.appKey = args.appKey ?? ''
        this.site = args.site ?? ''
    }

    async makeDatadogRequest({
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
        const url = `https://api.${this.site}/api/v1${endpoint}`

        const headers = {
            'DD-API-KEY': this.apiKey,
            'DD-APPLICATION-KEY': this.appKey,
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
            throw new Error(`Datadog API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListMonitorsTool extends BaseDatadogTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_monitors',
            description: 'List monitors from Datadog',
            schema: ListMonitorsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            appKey: args.appKey,
            site: args.site,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const response = await this.makeDatadogRequest({ endpoint: '/monitor', params })
            return response
        } catch (error) {
            return formatToolError(`Error listing monitors: ${error}`, params)
        }
    }
}

class GetMonitorTool extends BaseDatadogTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_monitor',
            description: 'Get a specific monitor from Datadog',
            schema: GetMonitorSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            appKey: args.appKey,
            site: args.site,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/monitor/${params.monitorId}`
            const response = await this.makeDatadogRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting monitor: ${error}`, params)
        }
    }
}

class CreateMonitorTool extends BaseDatadogTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_monitor',
            description: 'Create a new metric alert monitor in Datadog',
            schema: CreateMonitorSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            appKey: args.appKey,
            site: args.site,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                type: 'metric alert',
                query: params.query,
                name: params.name,
                message: params.message
            }

            const response = await this.makeDatadogRequest({ endpoint: '/monitor', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating monitor: ${error}`, params)
        }
    }
}

class PostEventTool extends BaseDatadogTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'post_event',
            description: 'Post an event to the Datadog event stream',
            schema: PostEventSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            appKey: args.appKey,
            site: args.site,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                title: params.title,
                text: params.text
            }

            const response = await this.makeDatadogRequest({ endpoint: '/events', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error posting event: ${error}`, params)
        }
    }
}

class QueryMetricsTool extends BaseDatadogTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'query_metrics',
            description: 'Query timeseries metrics from Datadog',
            schema: QueryMetricsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            appKey: args.appKey,
            site: args.site,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/query?from=${params.from}&to=${params.to}&query=${params.query}`
            const response = await this.makeDatadogRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error querying metrics: ${error}`, params)
        }
    }
}

export const createDatadogTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const apiKey = args?.apiKey || ''
    const appKey = args?.appKey || ''
    const site = args?.site || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_monitors')) {
        tools.push(
            new ListMonitorsTool({
                apiKey,
                appKey,
                site,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_monitor')) {
        tools.push(
            new GetMonitorTool({
                apiKey,
                appKey,
                site,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_monitor')) {
        tools.push(
            new CreateMonitorTool({
                apiKey,
                appKey,
                site,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('post_event')) {
        tools.push(
            new PostEventTool({
                apiKey,
                appKey,
                site,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('query_metrics')) {
        tools.push(
            new QueryMetricsTool({
                apiKey,
                appKey,
                site,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
