import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Trello API for managing boards and cards`

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
    apiKey?: string
    apiToken?: string
    defaultParams?: any
}

// Define schemas for different Trello operations

const ListBoardsSchema = z.object({})

const ListCardsSchema = z.object({
    boardId: z.string().describe('ID of the board to list cards from')
})

const CreateCardSchema = z.object({
    listId: z.string().describe('ID of the list to create the card in'),
    name: z.string().describe('Name/title of the card'),
    desc: z.string().optional().describe('Description of the card')
})

const GetCardSchema = z.object({
    cardId: z.string().describe('ID of the card to retrieve')
})

const UpdateCardSchema = z.object({
    cardId: z.string().describe('ID of the card to update'),
    name: z.string().optional().describe('Updated name/title of the card'),
    desc: z.string().optional().describe('Updated description of the card'),
    closed: z.boolean().optional().describe('Whether the card should be archived (closed)')
})

class BaseTrelloTool extends DynamicStructuredTool {
    protected apiKey: string = ''
    protected apiToken: string = ''
    protected trelloBaseUrl: string = 'https://api.trello.com/1'

    constructor(args: any) {
        super(args)
        this.apiKey = args.apiKey ?? ''
        this.apiToken = args.apiToken ?? ''
    }

    async makeTrelloRequest({
        endpoint,
        method = 'GET',
        queryParams,
        params
    }: {
        endpoint: string
        method?: string
        queryParams?: Record<string, string>
        params?: any
    }): Promise<string> {
        const mergedQueryParams = new URLSearchParams(queryParams ?? {})
        mergedQueryParams.append('key', this.apiKey)
        mergedQueryParams.append('token', this.apiToken)

        const url = `${this.trelloBaseUrl}${endpoint}?${mergedQueryParams.toString()}`

        const headers = {
            Accept: 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Trello API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListBoardsTool extends BaseTrelloTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_boards',
            description: 'List all Trello boards for the authenticated user',
            schema: ListBoardsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const response = await this.makeTrelloRequest({
                endpoint: '/members/me/boards',
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error listing boards: ${error}`, params)
        }
    }
}

class ListCardsTool extends BaseTrelloTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_cards',
            description: 'List all cards on a Trello board',
            schema: ListCardsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/boards/${params.boardId}/cards`
            const response = await this.makeTrelloRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing cards: ${error}`, params)
        }
    }
}

class CreateCardTool extends BaseTrelloTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_card',
            description: 'Create a new card in a Trello list',
            schema: CreateCardSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const queryParams: Record<string, string> = {
                idList: params.listId,
                name: params.name
            }
            if (params.desc) queryParams.desc = params.desc

            const response = await this.makeTrelloRequest({
                endpoint: '/cards',
                method: 'POST',
                queryParams,
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error creating card: ${error}`, params)
        }
    }
}

class GetCardTool extends BaseTrelloTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_card',
            description: 'Get a specific card from Trello',
            schema: GetCardSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/cards/${params.cardId}`
            const response = await this.makeTrelloRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting card: ${error}`, params)
        }
    }
}

class UpdateCardTool extends BaseTrelloTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'update_card',
            description: 'Update an existing Trello card',
            schema: UpdateCardSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const queryParams: Record<string, string> = {}
            if (params.name !== undefined) queryParams.name = params.name
            if (params.desc !== undefined) queryParams.desc = params.desc
            if (params.closed !== undefined) queryParams.closed = String(params.closed)

            const endpoint = `/cards/${params.cardId}`
            const response = await this.makeTrelloRequest({
                endpoint,
                method: 'PUT',
                queryParams,
                params
            })
            return response || 'Card updated successfully'
        } catch (error) {
            return formatToolError(`Error updating card: ${error}`, params)
        }
    }
}

export const createTrelloTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const apiKey = args?.apiKey || ''
    const apiToken = args?.apiToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_boards')) {
        tools.push(
            new ListBoardsTool({
                apiKey,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_cards')) {
        tools.push(
            new ListCardsTool({
                apiKey,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_card')) {
        tools.push(
            new CreateCardTool({
                apiKey,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_card')) {
        tools.push(
            new GetCardTool({
                apiKey,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('update_card')) {
        tools.push(
            new UpdateCardTool({
                apiKey,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
