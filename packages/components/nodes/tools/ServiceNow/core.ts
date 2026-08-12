import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access ServiceNow API for querying and managing records via the Table API`

export interface RequestParameters {
    name?: string
    actions?: string[]
    instance?: string
    clientId?: string
    clientSecret?: string
    defaultParams?: any
    maxOutputLength?: number
}

// Fetches a fresh OAuth2 client-credentials access token from ServiceNow.
// A new token is requested per tool invocation rather than cached/persisted.
export async function getServiceNowAccessToken(instance: string, clientId: string, clientSecret: string): Promise<string> {
    const tokenUrl = `https://${instance}.service-now.com/oauth_token.do`
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
    }).toString()

    const response = await secureFetch(tokenUrl, {
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

    const data: any = await response.json()
    return data.access_token
}

// Define schemas for different ServiceNow operations
const QueryTableSchema = z.object({
    tableName: z.string().describe('e.g. incident, problem, change_request'),
    query: z.string().optional().describe('Encoded ServiceNow query, e.g. "active=true^priority=1"'),
    limit: z.number().optional().default(25)
})

const GetRecordSchema = z.object({
    tableName: z.string(),
    sysId: z.string()
})

const CreateRecordSchema = z.object({
    tableName: z.string(),
    fields: z.record(z.any())
})

const UpdateRecordSchema = z.object({
    tableName: z.string(),
    sysId: z.string(),
    fields: z.record(z.any())
})

const DeleteRecordSchema = z.object({
    tableName: z.string(),
    sysId: z.string()
})

class BaseServiceNowTool extends DynamicStructuredTool {
    protected instance: string = ''
    protected clientId: string = ''
    protected clientSecret: string = ''

    constructor(args: any) {
        super(args)
        this.instance = args.instance ?? ''
        this.clientId = args.clientId ?? ''
        this.clientSecret = args.clientSecret ?? ''
    }

    async makeServiceNowRequest({
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
        const accessToken = await getServiceNowAccessToken(this.instance, this.clientId, this.clientSecret)

        const url = `https://${this.instance}.service-now.com/api/now${endpoint}`

        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
            throw new Error(`ServiceNow API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        // ServiceNow returns HTTP 204 with no body for successful deletes
        if (response.status === 204) {
            return 'Record deleted successfully' + TOOL_ARGS_PREFIX + JSON.stringify(params)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class QueryTableTool extends BaseServiceNowTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const queryParams = new URLSearchParams()
            if (params.query) queryParams.append('sysparm_query', params.query)
            queryParams.append('sysparm_limit', String(params.limit ?? 25))

            const endpoint = `/table/${params.tableName}?${queryParams.toString()}`
            const response = await this.makeServiceNowRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error querying table: ${error}`, params)
        }
    }
}

class GetRecordTool extends BaseServiceNowTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/table/${params.tableName}/${params.sysId}`
            const response = await this.makeServiceNowRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting record: ${error}`, params)
        }
    }
}

class CreateRecordTool extends BaseServiceNowTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/table/${params.tableName}`
            const response = await this.makeServiceNowRequest({ endpoint, method: 'POST', body: params.fields, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating record: ${error}`, params)
        }
    }
}

class UpdateRecordTool extends BaseServiceNowTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/table/${params.tableName}/${params.sysId}`
            const response = await this.makeServiceNowRequest({ endpoint, method: 'PATCH', body: params.fields, params })
            return response || 'Record updated successfully'
        } catch (error) {
            return formatToolError(`Error updating record: ${error}`, params)
        }
    }
}

class DeleteRecordTool extends BaseServiceNowTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/table/${params.tableName}/${params.sysId}`
            const response = await this.makeServiceNowRequest({ endpoint, method: 'DELETE', params })
            return response || 'Record deleted successfully'
        } catch (error) {
            return formatToolError(`Error deleting record: ${error}`, params)
        }
    }
}

export const createServiceNowTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
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
