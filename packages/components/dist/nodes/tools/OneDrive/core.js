'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createOneDriveTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access OneDrive API for managing files and folders`
// Define schemas for different OneDrive operations
const ListRootItemsSchema = v3_1.z.object({})
const ListFolderItemsSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe('ID of the folder item to list children for')
})
const GetItemSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe('ID of the item to retrieve')
})
const CreateFolderSchema = v3_1.z.object({
    parentId: v3_1.z.string().default('root').describe('ID of the parent folder to create the new folder in'),
    name: v3_1.z.string().describe('Name of the new folder')
})
const DeleteItemSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe('ID of the item to delete')
})
class BaseOneDriveTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.accessToken = ''
        this.accessToken = args.accessToken ?? ''
    }
    async makeOneDriveRequest({ endpoint, method = 'GET', body, params }) {
        const url = `https://graph.microsoft.com/v1.0/me/drive${endpoint}`
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
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
            throw new Error(`OneDrive API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        if (response.status === 204) {
            return 'Item deleted successfully' + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListRootItemsTool extends BaseOneDriveTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const response = await this.makeOneDriveRequest({ endpoint: '/root/children', params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing root items: ${error}`, params)
        }
    }
}
class ListFolderItemsTool extends BaseOneDriveTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/items/${params.itemId}/children`
            const response = await this.makeOneDriveRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing folder items: ${error}`, params)
        }
    }
}
class GetItemTool extends BaseOneDriveTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/items/${params.itemId}`
            const response = await this.makeOneDriveRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting item: ${error}`, params)
        }
    }
}
class CreateFolderTool extends BaseOneDriveTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error creating folder: ${error}`, params)
        }
    }
}
class DeleteItemTool extends BaseOneDriveTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/items/${params.itemId}`
            const response = await this.makeOneDriveRequest({ endpoint, method: 'DELETE', params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting item: ${error}`, params)
        }
    }
}
const createOneDriveTools = (args) => {
    const tools = []
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
exports.createOneDriveTools = createOneDriveTools
//# sourceMappingURL=core.js.map
