import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Dropbox API for managing files and folders`

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

const DROPBOX_BASE_URL = 'https://api.dropboxapi.com/2'

// Define schemas for different Dropbox operations
const ListFolderSchema = z.object({
    path: z.string().describe('Folder path, e.g. "" for root or "/MyFolder"')
})

const CreateFolderSchema = z.object({
    path: z.string().describe('Folder path to create, e.g. "/MyFolder"')
})

const DeleteSchema = z.object({
    path: z.string().describe('Path of the file or folder to delete')
})

const GetMetadataSchema = z.object({
    path: z.string().describe('Path of the file or folder to get metadata for')
})

const SearchSchema = z.object({
    query: z.string().describe('Search query string')
})

class BaseDropboxTool extends DynamicStructuredTool {
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.accessToken = args.accessToken ?? ''
    }

    async makeDropboxRequest({ endpoint, body, params }: { endpoint: string; body?: any; params?: any }): Promise<string> {
        const url = `${DROPBOX_BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method: 'POST',
            headers,
            body: JSON.stringify(body ?? {})
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Dropbox API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListFolderTool extends BaseDropboxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_folder',
            description: 'List the contents of a folder in Dropbox',
            schema: ListFolderSchema,
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
            const response = await this.makeDropboxRequest({
                endpoint: '/files/list_folder',
                body: { path: params.path },
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error listing folder: ${error}`, params)
        }
    }
}

class CreateFolderTool extends BaseDropboxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_folder',
            description: 'Create a new folder in Dropbox',
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
            const response = await this.makeDropboxRequest({
                endpoint: '/files/create_folder_v2',
                body: { path: params.path },
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error creating folder: ${error}`, params)
        }
    }
}

class DeleteTool extends BaseDropboxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'delete',
            description: 'Delete a file or folder in Dropbox',
            schema: DeleteSchema,
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
            const response = await this.makeDropboxRequest({
                endpoint: '/files/delete_v2',
                body: { path: params.path },
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error deleting: ${error}`, params)
        }
    }
}

class GetMetadataTool extends BaseDropboxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_metadata',
            description: 'Get metadata for a file or folder in Dropbox',
            schema: GetMetadataSchema,
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
            const response = await this.makeDropboxRequest({
                endpoint: '/files/get_metadata',
                body: { path: params.path },
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error getting metadata: ${error}`, params)
        }
    }
}

class SearchTool extends BaseDropboxTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'search',
            description: 'Search for files and folders in Dropbox',
            schema: SearchSchema,
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
            const response = await this.makeDropboxRequest({
                endpoint: '/files/search_v2',
                body: { query: params.query },
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error searching: ${error}`, params)
        }
    }
}

export const createDropboxTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_folder')) {
        tools.push(
            new ListFolderTool({
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

    if (actions.includes('delete')) {
        tools.push(
            new DeleteTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_metadata')) {
        tools.push(
            new GetMetadataTool({
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
