'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createServiceNowTools = exports.desc = void 0
exports.getServiceNowAccessToken = getServiceNowAccessToken
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access ServiceNow API for querying and managing records via the Table API`
// Fetches a fresh OAuth2 client-credentials access token from ServiceNow.
// A new token is requested per tool invocation rather than cached/persisted.
async function getServiceNowAccessToken(instance, clientId, clientSecret) {
    const tokenUrl = `https://${instance}.service-now.com/oauth_token.do`
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
    }).toString()
    const response = await (0, httpSecurity_1.secureFetch)(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    })
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ServiceNow OAuth Error ${response.status}: ${response.statusText} - ${errorText}`)
    }
    const data = await response.json()
    return data.access_token
}
// Define schemas for different ServiceNow operations
const QueryTableSchema = v3_1.z.object({
    tableName: v3_1.z.string().describe('e.g. incident, problem, change_request'),
    query: v3_1.z.string().optional().describe('Encoded ServiceNow query, e.g. "active=true^priority=1"'),
    limit: v3_1.z.number().optional().default(25)
})
const GetRecordSchema = v3_1.z.object({
    tableName: v3_1.z.string(),
    sysId: v3_1.z.string()
})
const CreateRecordSchema = v3_1.z.object({
    tableName: v3_1.z.string(),
    fields: v3_1.z.record(v3_1.z.any())
})
const UpdateRecordSchema = v3_1.z.object({
    tableName: v3_1.z.string(),
    sysId: v3_1.z.string(),
    fields: v3_1.z.record(v3_1.z.any())
})
const DeleteRecordSchema = v3_1.z.object({
    tableName: v3_1.z.string(),
    sysId: v3_1.z.string()
})
class BaseServiceNowTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.instance = ''
        this.clientId = ''
        this.clientSecret = ''
        this.instance = args.instance ?? ''
        this.clientId = args.clientId ?? ''
        this.clientSecret = args.clientSecret ?? ''
    }
    async makeServiceNowRequest({ endpoint, method = 'GET', body, params }) {
        const accessToken = await getServiceNowAccessToken(this.instance, this.clientId, this.clientSecret)
        const url = `https://${this.instance}.service-now.com/api/now${endpoint}`
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
            throw new Error(`ServiceNow API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        // ServiceNow returns HTTP 204 with no body for successful deletes
        if (response.status === 204) {
            return 'Record deleted successfully' + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class QueryTableTool extends BaseServiceNowTool {
    constructor(args) {
        const toolInput = {
            name: 'query_table',
            description: 'Query records from a ServiceNow table',
            schema: QueryTableSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            instance: args.instance,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const queryParams = new URLSearchParams()
            if (params.query) queryParams.append('sysparm_query', params.query)
            queryParams.append('sysparm_limit', String(params.limit ?? 25))
            const endpoint = `/table/${params.tableName}?${queryParams.toString()}`
            const response = await this.makeServiceNowRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error querying table: ${error}`, params)
        }
    }
}
class GetRecordTool extends BaseServiceNowTool {
    constructor(args) {
        const toolInput = {
            name: 'get_record',
            description: 'Get a specific record from a ServiceNow table',
            schema: GetRecordSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            instance: args.instance,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/table/${params.tableName}/${params.sysId}`
            const response = await this.makeServiceNowRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting record: ${error}`, params)
        }
    }
}
class CreateRecordTool extends BaseServiceNowTool {
    constructor(args) {
        const toolInput = {
            name: 'create_record',
            description: 'Create a new record in a ServiceNow table',
            schema: CreateRecordSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            instance: args.instance,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/table/${params.tableName}`
            const response = await this.makeServiceNowRequest({ endpoint, method: 'POST', body: params.fields, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating record: ${error}`, params)
        }
    }
}
class UpdateRecordTool extends BaseServiceNowTool {
    constructor(args) {
        const toolInput = {
            name: 'update_record',
            description: 'Update an existing record in a ServiceNow table',
            schema: UpdateRecordSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        }
        super({
            ...toolInput,
            instance: args.instance,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/table/${params.tableName}/${params.sysId}`
            const response = await this.makeServiceNowRequest({ endpoint, method: 'PATCH', body: params.fields, params })
            return response || 'Record updated successfully'
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error updating record: ${error}`, params)
        }
    }
}
class DeleteRecordTool extends BaseServiceNowTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_record',
            description: 'Delete a record from a ServiceNow table',
            schema: DeleteRecordSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        }
        super({
            ...toolInput,
            instance: args.instance,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/table/${params.tableName}/${params.sysId}`
            const response = await this.makeServiceNowRequest({ endpoint, method: 'DELETE', params })
            return response || 'Record deleted successfully'
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting record: ${error}`, params)
        }
    }
}
const createServiceNowTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const instance = args?.instance || ''
    const clientId = args?.clientId || ''
    const clientSecret = args?.clientSecret || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('query_table')) {
        tools.push(new QueryTableTool({ instance, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    if (actions.includes('get_record')) {
        tools.push(new GetRecordTool({ instance, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    if (actions.includes('create_record')) {
        tools.push(new CreateRecordTool({ instance, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    if (actions.includes('update_record')) {
        tools.push(new UpdateRecordTool({ instance, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    if (actions.includes('delete_record')) {
        tools.push(new DeleteRecordTool({ instance, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    return tools
}
exports.createServiceNowTools = createServiceNowTools
//# sourceMappingURL=core.js.map
