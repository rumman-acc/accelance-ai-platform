import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Freshdesk API for managing support tickets and contacts`

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
    domain?: string
    apiKey?: string
    defaultParams?: any
}

// Define schemas for different Freshdesk operations

const ListTicketsSchema = z.object({
    limit: z.number().optional().default(25).describe('Maximum number of tickets to return')
})

const CreateTicketSchema = z.object({
    subject: z.string().describe('Subject of the ticket'),
    description: z.string().describe('Description of the ticket'),
    email: z.string().describe('Email address of the requester'),
    priority: z.number().optional().default(1).describe('1=low, 2=medium, 3=high, 4=urgent'),
    status: z.number().optional().default(2).describe('2=open, 3=pending, 4=resolved, 5=closed')
})

const GetTicketSchema = z.object({
    ticketId: z.string().describe('ID of the ticket to retrieve')
})

const UpdateTicketSchema = z.object({
    ticketId: z.string().describe('ID of the ticket to update'),
    status: z.number().optional().describe('2=open, 3=pending, 4=resolved, 5=closed'),
    priority: z.number().optional().describe('1=low, 2=medium, 3=high, 4=urgent')
})

const ListContactsSchema = z.object({
    limit: z.number().optional().default(25).describe('Maximum number of contacts to return')
})

class BaseFreshdeskTool extends DynamicStructuredTool {
    protected domain: string = ''
    protected apiKey: string = ''

    constructor(args: any) {
        super(args)
        this.domain = args.domain ?? ''
        this.apiKey = args.apiKey ?? ''
    }

    async makeFreshdeskRequest({
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
        const url = `https://${this.domain}.freshdesk.com/api/v2/${endpoint}`

        const auth = Buffer.from(`${this.apiKey}:X`).toString('base64')
        const authHeader = `Basic ${auth}`

        const headers = {
            Authorization: authHeader,
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
            throw new Error(`Freshdesk API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

// Ticket Tools
class ListTicketsTool extends BaseFreshdeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_tickets',
            description: 'List tickets from Freshdesk',
            schema: ListTicketsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            domain: args.domain,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `tickets?per_page=${params.limit}`
            const response = await this.makeFreshdeskRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing tickets: ${error}`, params)
        }
    }
}

class CreateTicketTool extends BaseFreshdeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_ticket',
            description: 'Create a new ticket in Freshdesk',
            schema: CreateTicketSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            domain: args.domain,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const ticketData = {
                subject: params.subject,
                description: params.description,
                email: params.email,
                priority: params.priority ?? 1,
                status: params.status ?? 2
            }

            const response = await this.makeFreshdeskRequest({ endpoint: 'tickets', method: 'POST', body: ticketData, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating ticket: ${error}`, params)
        }
    }
}

class GetTicketTool extends BaseFreshdeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_ticket',
            description: 'Get a specific ticket from Freshdesk',
            schema: GetTicketSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            domain: args.domain,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `tickets/${params.ticketId}`
            const response = await this.makeFreshdeskRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting ticket: ${error}`, params)
        }
    }
}

class UpdateTicketTool extends BaseFreshdeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'update_ticket',
            description: 'Update an existing ticket in Freshdesk',
            schema: UpdateTicketSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            domain: args.domain,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const updateData: any = {}
            if (params.status !== undefined) updateData.status = params.status
            if (params.priority !== undefined) updateData.priority = params.priority

            const endpoint = `tickets/${params.ticketId}`
            const response = await this.makeFreshdeskRequest({ endpoint, method: 'PUT', body: updateData, params })
            return response || 'Ticket updated successfully'
        } catch (error) {
            return formatToolError(`Error updating ticket: ${error}`, params)
        }
    }
}

// Contact Tools
class ListContactsTool extends BaseFreshdeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_contacts',
            description: 'List contacts from Freshdesk',
            schema: ListContactsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            domain: args.domain,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `contacts?per_page=${params.limit}`
            const response = await this.makeFreshdeskRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing contacts: ${error}`, params)
        }
    }
}

export const createFreshdeskTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const domain = args?.domain || ''
    const apiKey = args?.apiKey || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_tickets')) {
        tools.push(
            new ListTicketsTool({
                domain,
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_ticket')) {
        tools.push(
            new CreateTicketTool({
                domain,
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_ticket')) {
        tools.push(
            new GetTicketTool({
                domain,
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('update_ticket')) {
        tools.push(
            new UpdateTicketTool({
                domain,
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_contacts')) {
        tools.push(
            new ListContactsTool({
                domain,
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
