import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Zendesk API for managing support tickets`

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
    subdomain?: string
    email?: string
    apiToken?: string
    defaultParams?: any
}

// Define schemas for different Zendesk operations

const ListTicketsSchema = z.object({
    limit: z.number().optional().default(25).describe('Maximum number of tickets to return')
})

const CreateTicketSchema = z.object({
    subject: z.string().describe('Subject of the ticket'),
    commentBody: z.string().describe('Body of the initial comment on the ticket'),
    priority: z.string().optional().describe('urgent, high, normal, or low')
})

const GetTicketSchema = z.object({
    ticketId: z.string().describe('ID of the ticket')
})

const UpdateTicketSchema = z.object({
    ticketId: z.string().describe('ID of the ticket'),
    status: z.string().optional().describe('new, open, pending, hold, solved, closed'),
    commentBody: z.string().optional().describe('Body of the comment to add to the ticket')
})

const SearchTicketsSchema = z.object({
    query: z.string().describe('Zendesk search syntax, e.g. "type:ticket status:open"')
})

class BaseZendeskTool extends DynamicStructuredTool {
    protected subdomain: string = ''
    protected email: string = ''
    protected apiToken: string = ''

    constructor(args: any) {
        super(args)
        this.subdomain = args.subdomain ?? ''
        this.email = args.email ?? ''
        this.apiToken = args.apiToken ?? ''
    }

    async makeZendeskRequest({
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
        const url = `https://${this.subdomain}.zendesk.com/api/v2/${endpoint}`

        const auth = Buffer.from(`${this.email}/token:${this.apiToken}`).toString('base64')
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
            throw new Error(`Zendesk API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListTicketsTool extends BaseZendeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_tickets',
            description: 'List tickets from Zendesk',
            schema: ListTicketsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const limit = params.limit || 25
            const endpoint = `tickets.json?per_page=${limit}`
            const response = await this.makeZendeskRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing tickets: ${error}`, params)
        }
    }
}

class CreateTicketTool extends BaseZendeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_ticket',
            description: 'Create a new ticket in Zendesk',
            schema: CreateTicketSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const ticketData: any = {
                ticket: {
                    subject: params.subject,
                    comment: {
                        body: params.commentBody
                    }
                }
            }

            if (params.priority) {
                ticketData.ticket.priority = params.priority
            }

            const endpoint = 'tickets.json'
            const response = await this.makeZendeskRequest({ endpoint, method: 'POST', body: ticketData, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating ticket: ${error}`, params)
        }
    }
}

class GetTicketTool extends BaseZendeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_ticket',
            description: 'Get a specific ticket from Zendesk',
            schema: GetTicketSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `tickets/${params.ticketId}.json`
            const response = await this.makeZendeskRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting ticket: ${error}`, params)
        }
    }
}

class UpdateTicketTool extends BaseZendeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'update_ticket',
            description: 'Update an existing ticket in Zendesk',
            schema: UpdateTicketSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const updateData: any = {
                ticket: {}
            }

            if (params.status) updateData.ticket.status = params.status
            if (params.commentBody) {
                updateData.ticket.comment = {
                    body: params.commentBody
                }
            }

            const endpoint = `tickets/${params.ticketId}.json`
            const response = await this.makeZendeskRequest({ endpoint, method: 'PUT', body: updateData, params })
            return response || 'Ticket updated successfully'
        } catch (error) {
            return formatToolError(`Error updating ticket: ${error}`, params)
        }
    }
}

class SearchTicketsTool extends BaseZendeskTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'search_tickets',
            description: 'Search for tickets in Zendesk',
            schema: SearchTicketsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `search.json?query=${encodeURIComponent(params.query)}`
            const response = await this.makeZendeskRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error searching tickets: ${error}`, params)
        }
    }
}

export const createZendeskTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const subdomain = args?.subdomain || ''
    const email = args?.email || ''
    const apiToken = args?.apiToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_tickets')) {
        tools.push(
            new ListTicketsTool({
                subdomain,
                email,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_ticket')) {
        tools.push(
            new CreateTicketTool({
                subdomain,
                email,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_ticket')) {
        tools.push(
            new GetTicketTool({
                subdomain,
                email,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('update_ticket')) {
        tools.push(
            new UpdateTicketTool({
                subdomain,
                email,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('search_tickets')) {
        tools.push(
            new SearchTicketsTool({
                subdomain,
                email,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
