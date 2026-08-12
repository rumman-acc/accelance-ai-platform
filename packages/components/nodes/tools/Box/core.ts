import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Box API for managing files and folders`

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

const BOX_API_BASE_URL = 'https://api.box.com/2.0'

// Schemas for different Box operations
const ListFolderItemsSchema = z.object({
    folderId: z.string().describe('Use "0" for the root folder')
})

const CreateFolderSchema = z.object({
    name: z.string().describe('Name of the folder to create'),
    parentId: z.string().default('0').describe('ID of the parent folder, defaults to root folder')
})

const GetFileInfoSchema = z.object({
    fileId: z.string().describe('ID of the file to retrieve information for')
})

const DeleteFileSchema = z.object({
    fileId: z.string().describe('ID of the file to delete')
})

const SearchSchema = z.object({
    query: z.string().describe('Search query string')
})

class BaseBoxTool extends DynamicStructuredTool {
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.accessToken = args.accessToken ?? ''
    }

    async makeBoxRequest({
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
        const url = `${BOX_API_BASE_URL}${endpoint}`

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

        const response = await secureFetch(url, fetchOptions, 5)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Box API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        if (response.status === 204) {
            return 'Success' + TOOL_ARGS_PREFIX + JSON.stringify(params)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListFolderItemsTool extends BaseBoxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_folder_items',
            description: 'List items (files and folders) inside a Box folder',
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
            const endpoint = `/folders/${params.folderId}/items`
            const response = await this.makeBoxRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing folder items: ${error}`, params)
        }
    }
}

class CreateFolderTool extends BaseBoxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_folder',
            description: 'Create a new folder in Box',
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
            const body = {
                name: params.name,
                parent: {
                    id: params.parentId
                }
            }

            const endpoint = `/folders`
            const response = await this.makeBoxRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating folder: ${error}`, params)
        }
    }
}

class GetFileInfoTool extends BaseBoxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_file_info',
            description: 'Get information about a file in Box',
            schema: GetFileInfoSchema,
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
            const endpoint = `/files/${params.fileId}`
            const response = await this.makeBoxRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting file info: ${error}`, params)
        }
    }
}

class DeleteFileTool extends BaseBoxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'delete_file',
            description: 'Delete a file from Box',
            schema: DeleteFileSchema,
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
            const endpoint = `/files/${params.fileId}`
            const response = await this.makeBoxRequest({ endpoint, method: 'DELETE', params })
            return response || 'File deleted successfully'
        } catch (error) {
            return formatToolError(`Error deleting file: ${error}`, params)
        }
    }
}

class SearchTool extends BaseBoxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'search',
            description: 'Search for files and folders in Box',
            schema: SearchSchema,
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
            const queryParams = new URLSearchParams()
            queryParams.append('query', params.query)

            const endpoint = `/search?${queryParams.toString()}`
            const response = await this.makeBoxRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error searching: ${error}`, params)
        }
    }
}

export const createBoxTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_folder_items')) {
        tools.push(
            new ListFolderItemsTool({
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

    if (actions.includes('get_file_info')) {
        tools.push(
            new GetFileInfoTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('delete_file')) {
        tools.push(
            new DeleteFileTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('search')) {
        tools.push(
            new SearchTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
