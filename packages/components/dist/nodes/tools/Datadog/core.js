'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createDatadogTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Datadog API for querying metrics and managing monitors`
// Define schemas for different Datadog operations
const ListMonitorsSchema = v3_1.z.object({})
const GetMonitorSchema = v3_1.z.object({
    monitorId: v3_1.z.string()
})
const CreateMonitorSchema = v3_1.z.object({
    query: v3_1.z.string().describe('Datadog monitor query, e.g. "avg(last_5m):avg:system.cpu.user{*} > 80"'),
    name: v3_1.z.string(),
    message: v3_1.z.string()
})
const PostEventSchema = v3_1.z.object({
    title: v3_1.z.string(),
    text: v3_1.z.string()
})
const QueryMetricsSchema = v3_1.z.object({
    from: v3_1.z.number().describe('Unix timestamp, start of range'),
    to: v3_1.z.number().describe('Unix timestamp, end of range'),
    query: v3_1.z.string().describe('Datadog metric query, e.g. "avg:system.cpu.user{*}"')
})
class BaseDatadogTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.apiKey = ''
        this.appKey = ''
        this.site = ''
        this.apiKey = args.apiKey ?? ''
        this.appKey = args.appKey ?? ''
        this.site = args.site ?? ''
    }
    async makeDatadogRequest({ endpoint, method = 'GET', body, params }) {
        const url = `https://api.${this.site}/api/v1${endpoint}`
        const headers = {
            'DD-API-KEY': this.apiKey,
            'DD-APPLICATION-KEY': this.appKey,
            'Content-Type': 'application/json',
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Datadog API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListMonitorsTool extends BaseDatadogTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const response = await this.makeDatadogRequest({ endpoint: '/monitor', params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing monitors: ${error}`, params)
        }
    }
}
class GetMonitorTool extends BaseDatadogTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/monitor/${params.monitorId}`
            const response = await this.makeDatadogRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting monitor: ${error}`, params)
        }
    }
}
class CreateMonitorTool extends BaseDatadogTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error creating monitor: ${error}`, params)
        }
    }
}
class PostEventTool extends BaseDatadogTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                title: params.title,
                text: params.text
            }
            const response = await this.makeDatadogRequest({ endpoint: '/events', method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error posting event: ${error}`, params)
        }
    }
}
class QueryMetricsTool extends BaseDatadogTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/query?from=${params.from}&to=${params.to}&query=${params.query}`
            const response = await this.makeDatadogRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error querying metrics: ${error}`, params)
        }
    }
}
const createDatadogTools = (args) => {
    const tools = []
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
exports.createDatadogTools = createDatadogTools
//# sourceMappingURL=core.js.map
