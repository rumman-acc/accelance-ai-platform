'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createTelegramTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to send messages and manage a Telegram bot`
const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot'
// Define schemas for different Telegram operations
const SendMessageSchema = v3_1.z.object({
    chatId: v3_1.z.string().describe('Unique identifier for the target chat'),
    text: v3_1.z.string().describe('Message text to send')
})
const GetUpdatesSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of updates to retrieve')
})
const GetChatSchema = v3_1.z.object({
    chatId: v3_1.z.string().describe('Unique identifier for the target chat')
})
const SendPhotoSchema = v3_1.z.object({
    chatId: v3_1.z.string().describe('Unique identifier for the target chat'),
    photoUrl: v3_1.z.string().describe('URL of the photo to send'),
    caption: v3_1.z.string().optional().describe('Caption for the photo')
})
const GetMeSchema = v3_1.z.object({})
class BaseTelegramTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.botToken = ''
        this.botToken = args.botToken ?? ''
    }
    async makeTelegramRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${TELEGRAM_API_BASE_URL}${this.botToken}${endpoint}`
        const headers = {
            'Content-Type': 'application/json',
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5)
        const responseText = await response.text()
        let data
        try {
            data = JSON.parse(responseText)
        } catch (e) {
            data = undefined
        }
        if (!response.ok || (data && data.ok === false)) {
            const description = data?.description
            throw new Error(`Telegram API Error ${response.status}: ${description || response.statusText}`)
        }
        return responseText + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class SendMessageTool extends BaseTelegramTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error sending message: ${error}`, params)
        }
    }
}
class GetUpdatesTool extends BaseTelegramTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/getUpdates?limit=${params.limit}`
            const response = await this.makeTelegramRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting updates: ${error}`, params)
        }
    }
}
class GetChatTool extends BaseTelegramTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/getChat?chat_id=${params.chatId}`
            const response = await this.makeTelegramRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting chat: ${error}`, params)
        }
    }
}
class SendPhotoTool extends BaseTelegramTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = '/sendPhoto'
            const body = { chat_id: params.chatId, photo: params.photoUrl }
            if (params.caption) body.caption = params.caption
            const response = await this.makeTelegramRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error sending photo: ${error}`, params)
        }
    }
}
class GetMeTool extends BaseTelegramTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = '/getMe'
            const response = await this.makeTelegramRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting bot info: ${error}`, params)
        }
    }
}
const createTelegramTools = (args) => {
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
exports.createTelegramTools = createTelegramTools
//# sourceMappingURL=core.js.map
