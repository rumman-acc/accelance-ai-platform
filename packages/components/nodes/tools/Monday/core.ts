import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access monday.com API for managing boards and items`

const MONDAY_API_URL = 'https://api.monday.com/v2'
const MONDAY_API_VERSION = '2026-07'

export interface RequestParameters {
    actions?: string[]
    apiToken?: string
    maxOutputLength?: number
}

// Action schemas
const ListBoardsSchema = z.object({
    limit: z.number().optional().default(25).describe('Maximum number of boards to return')
})

const CreateItemSchema = z.object({
    boardId: z.string().describe('ID of the board to create the item on'),
    itemName: z.string().describe('Name of the new item')
})

const ListItemsSchema = z.object({
    boardId: z.string().describe('ID of the board to list items from')
})

const GetItemSchema = z.object({
    itemId: z.string().describe('ID of the item to retrieve')
})

const UpdateItemColumnSchema = z.object({
    boardId: z.string().describe('ID of the board the item belongs to'),
    itemId: z.string().describe('ID of the item to update'),
    columnId: z.string().describe('ID of the column to update'),
    value: z.string().describe('New value for the column')
})

/**
 * Makes a request to the monday.com GraphQL API.
 * monday.com exposes a single endpoint and returns HTTP 200 even when the
 * GraphQL query/mutation itself failed, so callers must inspect the `errors`
 * array in the response body.
 */
export async function makeMondayRequest(apiToken: string, query: string, variables?: Record<string, any>): Promise<any> {
    const headers = {
        Authorization: apiToken,
        'Content-Type': 'application/json',
        'API-Version': MONDAY_API_VERSION
    }

    const response = await secureFetch(MONDAY_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`monday.com API Error ${response.status}: ${response.statusText} - ${errorText}`)
    }

    const json: any = await response.json()

    if (Array.isArray(json?.errors) && json.errors.length > 0) {
        throw new Error(json.errors[0]?.message || 'monday.com API returned an error')
    }

    return json?.data
}

class BaseMondayTool extends DynamicStructuredTool {
    protected apiToken: string = ''

    constructor(args: any) {
        super(args)
        this.apiToken = args.apiToken ?? ''
    }
}

class ListBoardsTool extends BaseMondayTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_boards',
            description: 'List boards on monday.com',
            schema: ListBoardsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const query = `query ($limit: Int) { boards(limit: $limit) { id name } }`
            const data = await makeMondayRequest(this.apiToken, query, { limit: params.limit })
            return JSON.stringify(data) + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error listing boards: ${error}`, params)
        }
    }
}

class CreateItemTool extends BaseMondayTool {
    constructor(args: any) {
        const toolInput = {
            name: 'create_item',
            description: 'Create a new item on a monday.com board',
            schema: CreateItemSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const query = `mutation ($boardId: ID!, $itemName: String!) { create_item(board_id: $boardId, item_name: $itemName) { id } }`
            const data = await makeMondayRequest(this.apiToken, query, {
                boardId: params.boardId,
                itemName: params.itemName
            })
            return JSON.stringify(data) + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error creating item: ${error}`, params)
        }
    }
}

class ListItemsTool extends BaseMondayTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_items',
            description: 'List items on a monday.com board',
            schema: ListItemsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const query = `query ($boardId: ID!) { boards(ids: [$boardId]) { items_page { items { id name } } } }`
            const data = await makeMondayRequest(this.apiToken, query, { boardId: params.boardId })
            return JSON.stringify(data) + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error listing items: ${error}`, params)
        }
    }
}

class GetItemTool extends BaseMondayTool {
    constructor(args: any) {
        const toolInput = {
            name: 'get_item',
            description: 'Get a specific item from monday.com',
            schema: GetItemSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const query = `query ($itemId: ID!) { items(ids: [$itemId]) { id name column_values { id text } } }`
            const data = await makeMondayRequest(this.apiToken, query, { itemId: params.itemId })
            return JSON.stringify(data) + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error getting item: ${error}`, params)
        }
    }
}

class UpdateItemColumnTool extends BaseMondayTool {
    constructor(args: any) {
        const toolInput = {
            name: 'update_item_column',
            description: 'Update a column value on a monday.com item',
            schema: UpdateItemColumnSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const query = `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) { change_simple_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id } }`
            const data = await makeMondayRequest(this.apiToken, query, {
                boardId: params.boardId,
                itemId: params.itemId,
                columnId: params.columnId,
                value: params.value
            })
            return JSON.stringify(data) + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error updating item column: ${error}`, params)
        }
    }
}

export const createMondayTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const apiToken = args?.apiToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity

    if (actions.includes('list_boards')) {
        tools.push(new ListBoardsTool({ apiToken, maxOutputLength }))
    }

    if (actions.includes('create_item')) {
        tools.push(new CreateItemTool({ apiToken, maxOutputLength }))
    }

    if (actions.includes('list_items')) {
        tools.push(new ListItemsTool({ apiToken, maxOutputLength }))
    }

    if (actions.includes('get_item')) {
        tools.push(new GetItemTool({ apiToken, maxOutputLength }))
    }

    if (actions.includes('update_item_column')) {
        tools.push(new UpdateItemColumnTool({ apiToken, maxOutputLength }))
    }

    return tools
}
