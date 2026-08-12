import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access SharePoint API for managing sites, lists, and files`

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

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'

// Define schemas for different SharePoint operations
const GetSiteSchema = z.object({
    siteId: z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team')
})

const ListListsSchema = z.object({
    siteId: z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team')
})

const ListListItemsSchema = z.object({
    siteId: z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team'),
    listId: z.string().describe('ID of the list')
})

const CreateListItemSchema = z.object({
    siteId: z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team'),
    listId: z.string().describe('ID of the list'),
    fieldsJson: z.record(z.any()).describe('Field name/value pairs matching the list columns')
})

const ListDriveItemsSchema = z.object({
    siteId: z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team')
})

class BaseSharePointTool extends DynamicStructuredTool {
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.accessToken = args.accessToken ?? ''
    }

    async makeSharePointRequest({
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
        const url = `${GRAPH_BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
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
            throw new Error(`SharePoint API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class GetSiteTool extends BaseSharePointTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_site',
            description: 'Get a SharePoint site by ID',
            schema: GetSiteSchema,
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
            const endpoint = `/sites/${params.siteId}`
            const response = await this.makeSharePointRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting site: ${error}`, params)
        }
    }
}

class ListListsTool extends BaseSharePointTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_lists',
            description: 'List the lists in a SharePoint site',
            schema: ListListsSchema,
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
            const endpoint = `/sites/${params.siteId}/lists`
            const response = await this.makeSharePointRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing lists: ${error}`, params)
        }
    }
}

class ListListItemsTool extends BaseSharePointTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_list_items',
            description: 'List the items in a SharePoint list',
            schema: ListListItemsSchema,
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
            const endpoint = `/sites/${params.siteId}/lists/${params.listId}/items?expand=fields`
            const response = await this.makeSharePointRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing list items: ${error}`, params)
        }
    }
}

class CreateListItemTool extends BaseSharePointTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_list_item',
            description: 'Create a new item in a SharePoint list',
            schema: CreateListItemSchema,
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
            const endpoint = `/sites/${params.siteId}/lists/${params.listId}/items`
            const body = { fields: params.fieldsJson }
            const response = await this.makeSharePointRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating list item: ${error}`, params)
        }
    }
}

class ListDriveItemsTool extends BaseSharePointTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_drive_items',
            description: "List the items in a SharePoint site's default document library",
            schema: ListDriveItemsSchema,
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
            const endpoint = `/sites/${params.siteId}/drive/root/children`
            const response = await this.makeSharePointRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing drive items: ${error}`, params)
        }
    }
}

export const createSharePointTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('get_site')) {
        tools.push(
            new GetSiteTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_lists')) {
        tools.push(
            new ListListsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_list_items')) {
        tools.push(
            new ListListItemsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_list_item')) {
        tools.push(
            new CreateListItemTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_drive_items')) {
        tools.push(
            new ListDriveItemsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
