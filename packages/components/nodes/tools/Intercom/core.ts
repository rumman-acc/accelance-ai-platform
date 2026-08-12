import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Intercom API for managing contacts and conversations`

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
    accessToken?: string
    defaultParams?: any
}

const BASE_URL = 'https://api.intercom.io'

// Define schemas for different Intercom operations
const ListContactsSchema = z.object({
    limit: z.number().optional().default(20).describe('Maximum number of contacts to return')
})

const CreateContactSchema = z.object({
    email: z.string().describe('Email address of the contact'),
    name: z.string().optional().describe('Name of the contact')
})

const GetContactSchema = z.object({
    contactId: z.string().describe('ID of the contact to retrieve')
})

const CreateConversationSchema = z.object({
    contactId: z.string().describe('ID of the contact to start the conversation from'),
    messageBody: z.string().describe('Body of the message to send')
})

const ListConversationsSchema = z.object({
    limit: z.number().optional().default(20).describe('Maximum number of conversations to return')
})

class BaseIntercomTool extends DynamicStructuredTool {
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.accessToken = args.accessToken ?? ''
    }

    async makeIntercomRequest({
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
        const url = `${BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Intercom-Version': '2.11',
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
            throw new Error(`Intercom API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListContactsTool extends BaseIntercomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_contacts',
            description: 'List contacts from Intercom',
            schema: ListContactsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/contacts?per_page=${params.limit}`
            const response = await this.makeIntercomRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing contacts: ${error}`, params)
        }
    }
}

class CreateContactTool extends BaseIntercomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_contact',
            description: 'Create a new contact in Intercom',
            schema: CreateContactSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                email: params.email,
                name: params.name,
                role: 'user'
            }

            const response = await this.makeIntercomRequest({ endpoint: '/contacts', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating contact: ${error}`, params)
        }
    }
}

class GetContactTool extends BaseIntercomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_contact',
            description: 'Get a specific contact from Intercom',
            schema: GetContactSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/contacts/${params.contactId}`
            const response = await this.makeIntercomRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting contact: ${error}`, params)
        }
    }
}

class CreateConversationTool extends BaseIntercomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_conversation',
            description: 'Create a new conversation in Intercom',
            schema: CreateConversationSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                from: {
                    type: 'user',
                    id: params.contactId
                },
                body: params.messageBody
            }

            const response = await this.makeIntercomRequest({ endpoint: '/conversations', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating conversation: ${error}`, params)
        }
    }
}

class ListConversationsTool extends BaseIntercomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_conversations',
            description: 'List conversations from Intercom',
            schema: ListConversationsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/conversations?per_page=${params.limit}`
            const response = await this.makeIntercomRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing conversations: ${error}`, params)
        }
    }
}

export const createIntercomTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_contacts')) {
        tools.push(
            new ListContactsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_contact')) {
        tools.push(
            new CreateContactTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_contact')) {
        tools.push(
            new GetContactTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_conversation')) {
        tools.push(
            new CreateConversationTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_conversations')) {
        tools.push(
            new ListConversationsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
