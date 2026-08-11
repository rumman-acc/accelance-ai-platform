import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Airtable API for reading and writing records in a base`

export interface Headers {
    [key: string]: string
}

export interface Body {
    [key: string]: any
}

export interface AirtableAuthConfig {
    personalAccessToken: string
}

export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    personalAccessToken?: string
    baseId?: string
    tableName?: string
    defaultParams?: any
    authConfig?: AirtableAuthConfig
}

// Define schemas for different Airtable operations
const ListRecordsSchema = z.object({
    maxRecords: z.number().optional().default(20).describe('Maximum number of records to return'),
    filterByFormula: z.string().optional().describe(`Airtable formula to filter records, e.g. "{Status}='Done'"`)
})

const CreateRecordSchema = z.object({
    fields: z.record(z.any()).describe('Field name/value pairs matching the table columns')
})

const GetRecordSchema = z.object({
    recordId: z.string().describe('ID of the record to retrieve')
})

const UpdateRecordSchema = z.object({
    recordId: z.string().describe('ID of the record to update'),
    fields: z.record(z.any()).describe('Field name/value pairs matching the table columns')
})

const DeleteRecordSchema = z.object({
    recordId: z.string().describe('ID of the record to delete')
})

class BaseAirtableTool extends DynamicStructuredTool {
    protected personalAccessToken: string = ''
    protected baseId: string = ''
    protected tableName: string = ''
    protected authConfig: AirtableAuthConfig | undefined

    constructor(args: any) {
        super(args)
        this.personalAccessToken = args.personalAccessToken ?? ''
        this.baseId = args.baseId ?? ''
        this.tableName = args.tableName ?? ''
        this.authConfig = args.authConfig
    }

    async makeAirtableRequest({
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
        const baseUrl = `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(this.tableName)}`
        const url = `${baseUrl}${endpoint}`

        const token = this.authConfig?.personalAccessToken ?? this.personalAccessToken

        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
            throw new Error(`Airtable API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListRecordsTool extends BaseAirtableTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_records',
            description: 'List records from an Airtable table',
            schema: ListRecordsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }
        const queryParams = new URLSearchParams()

        if (params.maxRecords) queryParams.append('maxRecords', params.maxRecords.toString())
        if (params.filterByFormula) queryParams.append('filterByFormula', params.filterByFormula)

        const queryString = queryParams.toString()
        const endpoint = queryString ? `?${queryString}` : ''

        try {
            const response = await this.makeAirtableRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing records: ${error}`, params)
        }
    }
}

class CreateRecordTool extends BaseAirtableTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_record',
            description: 'Create a new record in an Airtable table',
            schema: CreateRecordSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = { fields: params.fields }
            const response = await this.makeAirtableRequest({ endpoint: '', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating record: ${error}`, params)
        }
    }
}

class GetRecordTool extends BaseAirtableTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_record',
            description: 'Get a specific record from an Airtable table',
            schema: GetRecordSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.recordId}`
            const response = await this.makeAirtableRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting record: ${error}`, params)
        }
    }
}

class UpdateRecordTool extends BaseAirtableTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'update_record',
            description: 'Update an existing record in an Airtable table',
            schema: UpdateRecordSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.recordId}`
            const body = { fields: params.fields }
            const response = await this.makeAirtableRequest({ endpoint, method: 'PATCH', body, params })
            return response || 'Record updated successfully'
        } catch (error) {
            return formatToolError(`Error updating record: ${error}`, params)
        }
    }
}

class DeleteRecordTool extends BaseAirtableTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'delete_record',
            description: 'Delete a record from an Airtable table',
            schema: DeleteRecordSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.recordId}`
            const response = await this.makeAirtableRequest({ endpoint, method: 'DELETE', params })
            return response || 'Record deleted successfully'
        } catch (error) {
            return formatToolError(`Error deleting record: ${error}`, params)
        }
    }
}

export const createAirtableTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const personalAccessToken = args?.personalAccessToken || ''
    const baseId = args?.baseId || ''
    const tableName = args?.tableName || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    const authConfig = args?.authConfig

    if (actions.includes('list_records')) {
        tools.push(
            new ListRecordsTool({
                personalAccessToken,
                baseId,
                tableName,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    if (actions.includes('create_record')) {
        tools.push(
            new CreateRecordTool({
                personalAccessToken,
                baseId,
                tableName,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    if (actions.includes('get_record')) {
        tools.push(
            new GetRecordTool({
                personalAccessToken,
                baseId,
                tableName,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    if (actions.includes('update_record')) {
        tools.push(
            new UpdateRecordTool({
                personalAccessToken,
                baseId,
                tableName,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    if (actions.includes('delete_record')) {
        tools.push(
            new DeleteRecordTool({
                personalAccessToken,
                baseId,
                tableName,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    return tools
}
