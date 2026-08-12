import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Confluence API for managing spaces and pages`

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
    username?: string
    accessToken?: string
    siteUrl?: string
    defaultParams?: any
}

// Define schemas for different Confluence operations

const ListSpacesSchema = z.object({})

const GetPageSchema = z.object({
    pageId: z.string().describe('ID of the Confluence page to retrieve')
})

const CreatePageSchema = z.object({
    title: z.string().describe('Title of the new page'),
    spaceKey: z.string().describe('Key of the space where the page will be created'),
    content: z.string().describe('Page body as Confluence storage-format HTML/XML')
})

const UpdatePageSchema = z.object({
    pageId: z.string().describe('ID of the Confluence page to update'),
    title: z.string().describe('Updated title of the page'),
    newVersionNumber: z.number().describe('Must be the current version number + 1'),
    content: z.string().describe('Page body as Confluence storage-format HTML/XML')
})

const SearchContentSchema = z.object({
    cql: z.string().describe('Confluence Query Language, e.g. "space=DEV and type=page"')
})

class BaseConfluenceTool extends DynamicStructuredTool {
    protected username: string = ''
    protected accessToken: string = ''
    protected siteUrl: string = ''

    constructor(args: any) {
        super(args)
        this.username = args.username ?? ''
        this.accessToken = args.accessToken ?? ''
        this.siteUrl = args.siteUrl ?? ''
    }

    async makeConfluenceRequest({
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
        const url = `${this.siteUrl}/wiki/rest/api/${endpoint}`

        const auth = Buffer.from(`${this.username}:${this.accessToken}`).toString('base64')
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

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Confluence API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListSpacesTool extends BaseConfluenceTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_spaces',
            description: 'List spaces in Confluence',
            schema: ListSpacesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const response = await this.makeConfluenceRequest({ endpoint: 'space', params })
            return response
        } catch (error) {
            return formatToolError(`Error listing spaces: ${error}`, params)
        }
    }
}

class GetPageTool extends BaseConfluenceTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_page',
            description: 'Get a specific page from Confluence',
            schema: GetPageSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `content/${params.pageId}`
            const response = await this.makeConfluenceRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting page: ${error}`, params)
        }
    }
}

class CreatePageTool extends BaseConfluenceTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_page',
            description: 'Create a new page in Confluence',
            schema: CreatePageSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const pageData = {
                type: 'page',
                title: params.title,
                space: {
                    key: params.spaceKey
                },
                body: {
                    storage: {
                        value: params.content,
                        representation: 'storage'
                    }
                }
            }

            const response = await this.makeConfluenceRequest({ endpoint: 'content', method: 'POST', body: pageData, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating page: ${error}`, params)
        }
    }
}

class UpdatePageTool extends BaseConfluenceTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'update_page',
            description: 'Update an existing page in Confluence',
            schema: UpdatePageSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const pageData = {
                id: params.pageId,
                type: 'page',
                title: params.title,
                version: {
                    number: params.newVersionNumber
                },
                body: {
                    storage: {
                        value: params.content,
                        representation: 'storage'
                    }
                }
            }

            const endpoint = `content/${params.pageId}`
            const response = await this.makeConfluenceRequest({ endpoint, method: 'PUT', body: pageData, params })
            return response
        } catch (error) {
            return formatToolError(`Error updating page: ${error}`, params)
        }
    }
}

class SearchContentTool extends BaseConfluenceTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'search_content',
            description: 'Search Confluence content using CQL (Confluence Query Language)',
            schema: SearchContentSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `content/search?cql=${encodeURIComponent(params.cql)}`
            const response = await this.makeConfluenceRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error searching content: ${error}`, params)
        }
    }
}

export const createConfluenceTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const username = args?.username || ''
    const accessToken = args?.accessToken || ''
    const siteUrl = args?.siteUrl || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_spaces')) {
        tools.push(
            new ListSpacesTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_page')) {
        tools.push(
            new GetPageTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_page')) {
        tools.push(
            new CreatePageTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('update_page')) {
        tools.push(
            new UpdatePageTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('search_content')) {
        tools.push(
            new SearchContentTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
