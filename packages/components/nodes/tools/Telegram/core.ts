import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to send messages and manage a Telegram bot`

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot'

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
    botToken?: string
    defaultParams?: any
}

// Define schemas for different Telegram operations
const SendMessageSchema = z.object({
    chatId: z.string().describe('Unique identifier for the target chat'),
    text: z.string().describe('Message text to send')
})

const GetUpdatesSchema = z.object({
    limit: z.number().optional().default(20).describe('Maximum number of updates to retrieve')
})

const GetChatSchema = z.object({
    chatId: z.string().describe('Unique identifier for the target chat')
})

const SendPhotoSchema = z.object({
    chatId: z.string().describe('Unique identifier for the target chat'),
    photoUrl: z.string().describe('URL of the photo to send'),
    caption: z.string().optional().describe('Caption for the photo')
})

const GetMeSchema = z.object({})

class BaseTelegramTool extends DynamicStructuredTool {
    protected botToken: string = ''

    constructor(args: any) {
        super(args)
        this.botToken = args.botToken ?? ''
    }

    async makeTelegramRequest({
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
        const url = `${TELEGRAM_API_BASE_URL}${this.botToken}${endpoint}`

        const headers = {
            'Content-Type': 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }

        const response = await secureFetch(url, fetchOptions, 5)
        const responseText = await response.text()

        let data: any
        try {
            data = JSON.parse(responseText)
        } catch (e) {
            data = undefined
        }

        if (!response.ok || (data && data.ok === false)) {
            const description = data?.description
            throw new Error(`Telegram API Error ${response.status}: ${description || response.statusText}`)
        }

        return responseText + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class SendMessageTool extends BaseTelegramTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'send_message',
            description: 'Send a text message to a Telegram chat',
            schema: SendMessageSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            botToken: args.botToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = '/sendMessage'
            const response = await this.makeTelegramRequest({
                endpoint,
                method: 'POST',
                body: { chat_id: params.chatId, text: params.text },
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error sending message: ${error}`, params)
        }
    }
}

class GetUpdatesTool extends BaseTelegramTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_updates',
            description: 'Get the latest updates (incoming messages) received by the Telegram bot',
            schema: GetUpdatesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            botToken: args.botToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/getUpdates?limit=${params.limit}`
            const response = await this.makeTelegramRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting updates: ${error}`, params)
        }
    }
}

class GetChatTool extends BaseTelegramTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_chat',
            description: 'Get up-to-date information about a Telegram chat',
            schema: GetChatSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            botToken: args.botToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/getChat?chat_id=${params.chatId}`
            const response = await this.makeTelegramRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting chat: ${error}`, params)
        }
    }
}

class SendPhotoTool extends BaseTelegramTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'send_photo',
            description: 'Send a photo to a Telegram chat',
            schema: SendPhotoSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            botToken: args.botToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = '/sendPhoto'
            const body: any = { chat_id: params.chatId, photo: params.photoUrl }
            if (params.caption) body.caption = params.caption

            const response = await this.makeTelegramRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error sending photo: ${error}`, params)
        }
    }
}

class GetMeTool extends BaseTelegramTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_me',
            description: "Verify the bot's token and get basic information about the bot itself",
            schema: GetMeSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            botToken: args.botToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = '/getMe'
            const response = await this.makeTelegramRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting bot info: ${error}`, params)
        }
    }
}

export const createTelegramTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const botToken = args?.botToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('send_message')) {
        tools.push(
            new SendMessageTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_updates')) {
        tools.push(
            new GetUpdatesTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_chat')) {
        tools.push(
            new GetChatTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('send_photo')) {
        tools.push(
            new SendPhotoTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_me')) {
        tools.push(
            new GetMeTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
