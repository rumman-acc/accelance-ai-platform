import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access OneDrive API for managing files and folders`

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

// Define schemas for different OneDrive operations
const ListRootItemsSchema = z.object({})

const ListFolderItemsSchema = z.object({
    itemId: z.string().describe('ID of the folder item to list children for')
})

const GetItemSchema = z.object({
    itemId: z.string().describe('ID of the item to retrieve')
})

const CreateFolderSchema = z.object({
    parentId: z.string().default('root').describe('ID of the parent folder to create the new folder in'),
    name: z.string().describe('Name of the new folder')
})

const DeleteItemSchema = z.object({
    itemId: z.string().describe('ID of the item to delete')
})

class BaseOneDriveTool extends DynamicStructuredTool {
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.accessToken = args.accessToken ?? ''
    }

    async makeOneDriveRequest({
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
        const url = `https://graph.microsoft.com/v1.0/me/drive${endpoint}`

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
            throw new Error(`OneDrive API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        if (response.status === 204) {
            return 'Item deleted successfully' + TOOL_ARGS_PREFIX + JSON.stringify(params)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListRootItemsTool extends BaseOneDriveTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_root_items',
            description: 'List items in the root folder of OneDrive',
            schema: ListRootItemsSchema,
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
            const response = await this.makeOneDriveRequest({ endpoint: '/root/children', params })
            return response
        } catch (error) {
            return formatToolError(`Error listing root items: ${error}`, params)
        }
    }
}

class ListFolderItemsTool extends BaseOneDriveTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_folder_items',
            description: 'List items in a specific OneDrive folder',
            schema: ListFolderItemsSchema,
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
            const endpoint = `/items/${params.itemId}/children`
            const response = await this.makeOneDriveRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing folder items: ${error}`, params)
        }
    }
}

class GetItemTool extends BaseOneDriveTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_item',
            description: 'Get metadata for a specific item in OneDrive',
            schema: GetItemSchema,
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
            const endpoint = `/items/${params.itemId}`
            const response = await this.makeOneDriveRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting item: ${error}`, params)
        }
    }
}

class CreateFolderTool extends BaseOneDriveTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_folder',
            description: 'Create a new folder in OneDrive',
            schema: CreateFolderSchema,
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
            const parentId = params.parentId || 'root'
            const folderData = {
                name: params.name,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            }

            const endpoint = `/items/${parentId}/children`
            const response = await this.makeOneDriveRequest({ endpoint, method: 'POST', body: folderData, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating folder: ${error}`, params)
        }
    }
}

class DeleteItemTool extends BaseOneDriveTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'delete_item',
            description: 'Delete an item from OneDrive',
            schema: DeleteItemSchema,
            baseUrl: '',
            method: 'DELETE',
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
            const endpoint = `/items/${params.itemId}`
            const response = await this.makeOneDriveRequest({ endpoint, method: 'DELETE', params })
            return response
        } catch (error) {
            return formatToolError(`Error deleting item: ${error}`, params)
        }
    }
}

export const createOneDriveTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_root_items')) {
        tools.push(
            new ListRootItemsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_folder_items')) {
        tools.push(
            new ListFolderItemsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_item')) {
        tools.push(
            new GetItemTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_folder')) {
        tools.push(
            new CreateFolderTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('delete_item')) {
        tools.push(
            new DeleteItemTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
