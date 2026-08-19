'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createConfluenceTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Confluence API for managing spaces and pages`
// Define schemas for different Confluence operations
const ListSpacesSchema = v3_1.z.object({})
const GetPageSchema = v3_1.z.object({
    pageId: v3_1.z.string().describe('ID of the Confluence page to retrieve')
})
const CreatePageSchema = v3_1.z.object({
    title: v3_1.z.string().describe('Title of the new page'),
    spaceKey: v3_1.z.string().describe('Key of the space where the page will be created'),
    content: v3_1.z.string().describe('Page body as Confluence storage-format HTML/XML')
})
const UpdatePageSchema = v3_1.z.object({
    pageId: v3_1.z.string().describe('ID of the Confluence page to update'),
    title: v3_1.z.string().describe('Updated title of the page'),
    newVersionNumber: v3_1.z.number().describe('Must be the current version number + 1'),
    content: v3_1.z.string().describe('Page body as Confluence storage-format HTML/XML')
})
const SearchContentSchema = v3_1.z.object({
    cql: v3_1.z.string().describe('Confluence Query Language, e.g. "space=DEV and type=page"')
})
class BaseConfluenceTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.username = ''
        this.accessToken = ''
        this.siteUrl = ''
        this.username = args.username ?? ''
        this.accessToken = args.accessToken ?? ''
        this.siteUrl = args.siteUrl ?? ''
    }
    async makeConfluenceRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${this.siteUrl}/wiki/rest/api/${endpoint}`
        const auth = Buffer.from(`${this.username}:${this.accessToken}`).toString('base64')
        const authHeader = `Basic ${auth}`
        const headers = {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Confluence API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListSpacesTool extends BaseConfluenceTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const response = await this.makeConfluenceRequest({ endpoint: 'space', params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing spaces: ${error}`, params)
        }
    }
}
class GetPageTool extends BaseConfluenceTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `content/${params.pageId}`
            const response = await this.makeConfluenceRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting page: ${error}`, params)
        }
    }
}
class CreatePageTool extends BaseConfluenceTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error creating page: ${error}`, params)
        }
    }
}
class UpdatePageTool extends BaseConfluenceTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error updating page: ${error}`, params)
        }
    }
}
class SearchContentTool extends BaseConfluenceTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `content/search?cql=${encodeURIComponent(params.cql)}`
            const response = await this.makeConfluenceRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error searching content: ${error}`, params)
        }
    }
}
const createConfluenceTools = (args) => {
    const tools = []
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
exports.createConfluenceTools = createConfluenceTools
//# sourceMappingURL=core.js.map
