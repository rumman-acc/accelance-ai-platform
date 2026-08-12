import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access QuickBooks Online API for managing invoices, customers, and accounts`

export interface RequestParameters {
    actions?: string[]
    realmId?: string
    accessToken?: string
    maxOutputLength?: number
}

// Define schemas for different QuickBooks operations

const QuerySchema = z.object({
    query: z.string().describe('QuickBooks SQL-like query, e.g. "SELECT * FROM Customer MAXRESULTS 10"')
})

const CreateCustomerSchema = z.object({
    displayName: z.string().describe('The display name of the customer to create')
})

const GetCustomerSchema = z.object({
    customerId: z.string().describe('The QuickBooks customer ID')
})

const CreateInvoiceSchema = z.object({
    customerId: z.string().describe('The QuickBooks customer ID to bill'),
    amount: z.number().describe('The invoice line amount')
})

const GetInvoiceSchema = z.object({
    invoiceId: z.string().describe('The QuickBooks invoice ID')
})

class BaseQuickBooksTool extends DynamicStructuredTool {
    protected realmId: string = ''
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.realmId = args.realmId ?? ''
        this.accessToken = args.accessToken ?? ''
    }

    async makeQuickBooksRequest({
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
        const url = `https://quickbooks.api.intuit.com/v3/company/${this.realmId}/${endpoint}`

        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
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
            throw new Error(`QuickBooks API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class QueryTool extends BaseQuickBooksTool {
    constructor(args: any) {
        const toolInput = {
            name: 'query',
            description: 'Run a QuickBooks SQL-like query and return the matching records',
            schema: QuerySchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `query?query=${encodeURIComponent(params.query)}`
            const response = await this.makeQuickBooksRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error running query: ${error}`, params)
        }
    }
}

class CreateCustomerTool extends BaseQuickBooksTool {
    constructor(args: any) {
        const toolInput = {
            name: 'create_customer',
            description: 'Create a new QuickBooks customer',
            schema: CreateCustomerSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `customer`
            const body = { DisplayName: params.displayName }
            const response = await this.makeQuickBooksRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating customer: ${error}`, params)
        }
    }
}

class GetCustomerTool extends BaseQuickBooksTool {
    constructor(args: any) {
        const toolInput = {
            name: 'get_customer',
            description: 'Get a specific QuickBooks customer by ID',
            schema: GetCustomerSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `customer/${params.customerId}`
            const response = await this.makeQuickBooksRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting customer: ${error}`, params)
        }
    }
}

class CreateInvoiceTool extends BaseQuickBooksTool {
    constructor(args: any) {
        const toolInput = {
            name: 'create_invoice',
            description: 'Create a new QuickBooks invoice for a customer',
            schema: CreateInvoiceSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `invoice`
            const body = {
                CustomerRef: { value: params.customerId },
                Line: [
                    {
                        Amount: params.amount,
                        DetailType: 'SalesItemLineDetail',
                        SalesItemLineDetail: { ItemRef: { value: '1' } }
                    }
                ]
            }
            const response = await this.makeQuickBooksRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating invoice: ${error}`, params)
        }
    }
}

class GetInvoiceTool extends BaseQuickBooksTool {
    constructor(args: any) {
        const toolInput = {
            name: 'get_invoice',
            description: 'Get a specific QuickBooks invoice by ID',
            schema: GetInvoiceSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `invoice/${params.invoiceId}`
            const response = await this.makeQuickBooksRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting invoice: ${error}`, params)
        }
    }
}

export const createQuickBooksTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const realmId = args?.realmId || ''
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity

    if (actions.includes('query')) {
        tools.push(new QueryTool({ realmId, accessToken, maxOutputLength }))
    }

    if (actions.includes('create_customer')) {
        tools.push(new CreateCustomerTool({ realmId, accessToken, maxOutputLength }))
    }

    if (actions.includes('get_customer')) {
        tools.push(new GetCustomerTool({ realmId, accessToken, maxOutputLength }))
    }

    if (actions.includes('create_invoice')) {
        tools.push(new CreateInvoiceTool({ realmId, accessToken, maxOutputLength }))
    }

    if (actions.includes('get_invoice')) {
        tools.push(new GetInvoiceTool({ realmId, accessToken, maxOutputLength }))
    }

    return tools
}
