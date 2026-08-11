import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to send messages and manage channels in a Discord server via a bot`

const DISCORD_API_BASE_URL = 'https://discord.com/api/v10'

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

// Define schemas for different Discord operations
const SendMessageSchema = z.object({
    channelId: z.string(),
    content: z.string().describe('Message text to send')
})

const ListChannelMessagesSchema = z.object({
    channelId: z.string(),
    limit: z.number().optional().default(20)
})

const ListGuildChannelsSchema = z.object({
    guildId: z.string()
})

const CreateChannelSchema = z.object({
    guildId: z.string(),
    name: z.string(),
    type: z.number().optional().default(0).describe('Discord channel type: 0=text, 2=voice, 4=category')
})

const GetChannelSchema = z.object({
    channelId: z.string()
})

class BaseDiscordTool extends DynamicStructuredTool {
    protected botToken: string = ''

    constructor(args: any) {
        super(args)
        this.botToken = args.botToken ?? ''
    }

    async makeDiscordRequest({
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
        const url = `${DISCORD_API_BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Bot ${this.botToken}`,
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
            throw new Error(`Discord API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class SendMessageTool extends BaseDiscordTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'send_message',
            description: 'Send a message to a Discord channel',
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
            const endpoint = `/channels/${params.channelId}/messages`
            const response = await this.makeDiscordRequest({ endpoint, method: 'POST', body: { content: params.content }, params })
            return response
        } catch (error) {
            return formatToolError(`Error sending message: ${error}`, params)
        }
    }
}

class ListChannelMessagesTool extends BaseDiscordTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_channel_messages',
            description: 'List recent messages from a Discord channel',
            schema: ListChannelMessagesSchema,
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
            const endpoint = `/channels/${params.channelId}/messages?limit=${params.limit}`
            const response = await this.makeDiscordRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing channel messages: ${error}`, params)
        }
    }
}

class ListGuildChannelsTool extends BaseDiscordTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_guild_channels',
            description: 'List all channels in a Discord guild (server)',
            schema: ListGuildChannelsSchema,
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
            const endpoint = `/guilds/${params.guildId}/channels`
            const response = await this.makeDiscordRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing guild channels: ${error}`, params)
        }
    }
}

class CreateChannelTool extends BaseDiscordTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_channel',
            description: 'Create a new channel in a Discord guild (server)',
            schema: CreateChannelSchema,
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
            const endpoint = `/guilds/${params.guildId}/channels`
            const response = await this.makeDiscordRequest({
                endpoint,
                method: 'POST',
                body: { name: params.name, type: params.type },
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error creating channel: ${error}`, params)
        }
    }
}

class GetChannelTool extends BaseDiscordTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_channel',
            description: 'Get details of a Discord channel',
            schema: GetChannelSchema,
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
            const endpoint = `/channels/${params.channelId}`
            const response = await this.makeDiscordRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting channel: ${error}`, params)
        }
    }
}

export const createDiscordTools = (args?: RequestParameters): DynamicStructuredTool[] => {
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

    if (actions.includes('list_channel_messages')) {
        tools.push(
            new ListChannelMessagesTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_guild_channels')) {
        tools.push(
            new ListGuildChannelsTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_channel')) {
        tools.push(
            new CreateChannelTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_channel')) {
        tools.push(
            new GetChannelTool({
                botToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
