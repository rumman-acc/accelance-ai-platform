'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createDiscordTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to send messages and manage channels in a Discord server via a bot`
const DISCORD_API_BASE_URL = 'https://discord.com/api/v10'
// Define schemas for different Discord operations
const SendMessageSchema = v3_1.z.object({
    channelId: v3_1.z.string(),
    content: v3_1.z.string().describe('Message text to send')
})
const ListChannelMessagesSchema = v3_1.z.object({
    channelId: v3_1.z.string(),
    limit: v3_1.z.number().optional().default(20)
})
const ListGuildChannelsSchema = v3_1.z.object({
    guildId: v3_1.z.string()
})
const CreateChannelSchema = v3_1.z.object({
    guildId: v3_1.z.string(),
    name: v3_1.z.string(),
    type: v3_1.z.number().optional().default(0).describe('Discord channel type: 0=text, 2=voice, 4=category')
})
const GetChannelSchema = v3_1.z.object({
    channelId: v3_1.z.string()
})
class BaseDiscordTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.botToken = ''
        this.botToken = args.botToken ?? ''
    }
    async makeDiscordRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${DISCORD_API_BASE_URL}${endpoint}`
        const headers = {
            Authorization: `Bot ${this.botToken}`,
            'Content-Type': 'application/json',
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Discord API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class SendMessageTool extends BaseDiscordTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/channels/${params.channelId}/messages`
            const response = await this.makeDiscordRequest({ endpoint, method: 'POST', body: { content: params.content }, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error sending message: ${error}`, params)
        }
    }
}
class ListChannelMessagesTool extends BaseDiscordTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/channels/${params.channelId}/messages?limit=${params.limit}`
            const response = await this.makeDiscordRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing channel messages: ${error}`, params)
        }
    }
}
class ListGuildChannelsTool extends BaseDiscordTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/guilds/${params.guildId}/channels`
            const response = await this.makeDiscordRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing guild channels: ${error}`, params)
        }
    }
}
class CreateChannelTool extends BaseDiscordTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error creating channel: ${error}`, params)
        }
    }
}
class GetChannelTool extends BaseDiscordTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/channels/${params.channelId}`
            const response = await this.makeDiscordRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting channel: ${error}`, params)
        }
    }
}
const createDiscordTools = (args) => {
    const tools = []
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
exports.createDiscordTools = createDiscordTools
//# sourceMappingURL=core.js.map
