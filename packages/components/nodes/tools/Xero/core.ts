import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Xero API for managing invoices, contacts, and accounts`

const XERO_BASE_URL = 'https://api.xero.com/api.xro/2.0'

export interface RequestParameters {
    actions?: string[]
    tenantId?: string
    accessToken?: string
    maxOutputLength?: number
}

// Define schemas for different Xero operations

const ListContactsSchema = z.object({})

const CreateContactSchema = z.object({
    name: z.string().describe('The contact name'),
    email: z.string().optional().describe('The contact email address')
})

const ListInvoicesSchema = z.object({})

const CreateInvoiceSchema = z.object({
    contactId: z.string().describe('The Xero ContactID to bill'),
    description: z.string().describe('Description of the line item'),
    amount: z.number().describe('The unit amount for the line item')
})

const ListAccountsSchema = z.object({})

class BaseXeroTool extends DynamicStructuredTool {
    protected tenantId: string = ''
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.tenantId = args.tenantId ?? ''
        this.accessToken = args.accessToken ?? ''
    }

    async makeXeroRequest({
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
        const url = `${XERO_BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'xero-tenant-id': this.tenantId,
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
            throw new Error(`Xero API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListContactsTool extends BaseXeroTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_contacts',
            description: 'List all contacts in Xero',
            schema: ListContactsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const response = await this.makeXeroRequest({ endpoint: '/Contacts', params })
            return response
        } catch (error) {
            return formatToolError(`Error listing contacts: ${error}`, params)
        }
    }
}

class CreateContactTool extends BaseXeroTool {
    constructor(args: any) {
        const toolInput = {
            name: 'create_contact',
            description: 'Create a new contact in Xero',
            schema: CreateContactSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const body = { Contacts: [{ Name: params.name, EmailAddress: params.email }] }
            const response = await this.makeXeroRequest({ endpoint: '/Contacts', method: 'PUT', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating contact: ${error}`, params)
        }
    }
}

class ListInvoicesTool extends BaseXeroTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_invoices',
            description: 'List all invoices in Xero',
            schema: ListInvoicesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const response = await this.makeXeroRequest({ endpoint: '/Invoices', params })
            return response
        } catch (error) {
            return formatToolError(`Error listing invoices: ${error}`, params)
        }
    }
}

class CreateInvoiceTool extends BaseXeroTool {
    constructor(args: any) {
        const toolInput = {
            name: 'create_invoice',
            description: 'Create a new accounts receivable invoice in Xero',
            schema: CreateInvoiceSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const body = {
                Invoices: [
                    {
                        Type: 'ACCREC',
                        Contact: { ContactID: params.contactId },
                        LineItems: [
                            {
                                Description: params.description,
                                Quantity: 1,
                                UnitAmount: params.amount,
                                AccountCode: '200'
                            }
                        ]
                    }
                ]
            }
            const response = await this.makeXeroRequest({ endpoint: '/Invoices', method: 'PUT', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating invoice: ${error}`, params)
        }
    }
}

class ListAccountsTool extends BaseXeroTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_accounts',
            description: 'List all accounts in the Xero chart of accounts',
            schema: ListAccountsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const response = await this.makeXeroRequest({ endpoint: '/Accounts', params })
            return response
        } catch (error) {
            return formatToolError(`Error listing accounts: ${error}`, params)
        }
    }
}

export const createXeroTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const tenantId = args?.tenantId || ''
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity

    if (actions.includes('list_contacts')) {
        tools.push(new ListContactsTool({ tenantId, accessToken, maxOutputLength }))
    }

    if (actions.includes('create_contact')) {
        tools.push(new CreateContactTool({ tenantId, accessToken, maxOutputLength }))
    }

    if (actions.includes('list_invoices')) {
        tools.push(new ListInvoicesTool({ tenantId, accessToken, maxOutputLength }))
    }

    if (actions.includes('create_invoice')) {
        tools.push(new CreateInvoiceTool({ tenantId, accessToken, maxOutputLength }))
    }

    if (actions.includes('list_accounts')) {
        tools.push(new ListAccountsTool({ tenantId, accessToken, maxOutputLength }))
    }

    return tools
}
