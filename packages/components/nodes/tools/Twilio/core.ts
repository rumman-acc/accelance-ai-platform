import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to send SMS messages and make phone calls via the Twilio API`

export interface Headers {
    [key: string]: string
}

export interface Body {
    [key: string]: any
}

export interface TwilioAuthConfig {
    accountSid?: string
    authToken?: string
}

export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    accountSid?: string
    authToken?: string
    authConfig?: TwilioAuthConfig
}

// Define schemas for different Twilio operations

const SendSmsSchema = z.object({
    to: z.string().describe('Recipient phone number in E.164 format, e.g. +15551234567'),
    from: z.string().describe('Your Twilio phone number in E.164 format'),
    body: z.string().describe('SMS message text')
})

const ListMessagesSchema = z.object({
    pageSize: z.number().optional().default(20).describe('Maximum number of messages to return')
})

const GetMessageSchema = z.object({
    messageSid: z.string().describe('SID of the message to retrieve')
})

const MakeCallSchema = z.object({
    to: z.string().describe('Recipient phone number in E.164 format'),
    from: z.string().describe('Your Twilio phone number in E.164 format'),
    url: z.string().describe('URL Twilio will fetch TwiML instructions from for this call')
})

const ListCallsSchema = z.object({
    pageSize: z.number().optional().default(20).describe('Maximum number of calls to return')
})

class BaseTwilioTool extends DynamicStructuredTool {
    protected accountSid: string = ''
    protected authToken: string = ''
    protected authConfig: TwilioAuthConfig | undefined

    constructor(args: any) {
        super(args)
        this.accountSid = args.accountSid ?? ''
        this.authToken = args.authToken ?? ''
        this.authConfig = args.authConfig
    }

    async makeTwilioRequest({
        endpoint,
        method = 'GET',
        body,
        params
    }: {
        endpoint: string
        method?: string
        body?: Record<string, any>
        params?: any
    }): Promise<string> {
        const accountSid = this.authConfig?.accountSid ?? this.accountSid
        const authToken = this.authConfig?.authToken ?? this.authToken

        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}${endpoint}`

        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        const authHeader = `Basic ${auth}`

        const headers: Headers = {
            Authorization: authHeader,
            Accept: 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers
        }

        if (body) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
            fetchOptions.body = new URLSearchParams(body).toString()
        }

        const response = await secureFetch(url, fetchOptions, 5)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Twilio API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class SendSmsTool extends BaseTwilioTool {
    constructor(args: any) {
        const toolInput = {
            name: 'send_sms',
            description: 'Send an SMS message via Twilio',
            schema: SendSmsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const formBody = {
                To: params.to,
                From: params.from,
                Body: params.body
            }

            const response = await this.makeTwilioRequest({ endpoint: '/Messages.json', method: 'POST', body: formBody, params })
            return response
        } catch (error) {
            return formatToolError(`Error sending SMS: ${error}`, params)
        }
    }
}

class ListMessagesTool extends BaseTwilioTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_messages',
            description: 'List SMS messages sent and received via Twilio',
            schema: ListMessagesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `/Messages.json?PageSize=${params.pageSize}`
            const response = await this.makeTwilioRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing messages: ${error}`, params)
        }
    }
}

class GetMessageTool extends BaseTwilioTool {
    constructor(args: any) {
        const toolInput = {
            name: 'get_message',
            description: 'Get a specific SMS message from Twilio',
            schema: GetMessageSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `/Messages/${params.messageSid}.json`
            const response = await this.makeTwilioRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting message: ${error}`, params)
        }
    }
}

class MakeCallTool extends BaseTwilioTool {
    constructor(args: any) {
        const toolInput = {
            name: 'make_call',
            description: 'Make a phone call via Twilio',
            schema: MakeCallSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const formBody = {
                To: params.to,
                From: params.from,
                Url: params.url
            }

            const response = await this.makeTwilioRequest({ endpoint: '/Calls.json', method: 'POST', body: formBody, params })
            return response
        } catch (error) {
            return formatToolError(`Error making call: ${error}`, params)
        }
    }
}

class ListCallsTool extends BaseTwilioTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_calls',
            description: 'List phone calls made and received via Twilio',
            schema: ListCallsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `/Calls.json?PageSize=${params.pageSize}`
            const response = await this.makeTwilioRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing calls: ${error}`, params)
        }
    }
}

export const createTwilioTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const accountSid = args?.accountSid || ''
    const authToken = args?.authToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const authConfig = args?.authConfig

    if (actions.includes('send_sms')) {
        tools.push(
            new SendSmsTool({
                accountSid,
                authToken,
                maxOutputLength,
                authConfig
            })
        )
    }

    if (actions.includes('list_messages')) {
        tools.push(
            new ListMessagesTool({
                accountSid,
                authToken,
                maxOutputLength,
                authConfig
            })
        )
    }

    if (actions.includes('get_message')) {
        tools.push(
            new GetMessageTool({
                accountSid,
                authToken,
                maxOutputLength,
                authConfig
            })
        )
    }

    if (actions.includes('make_call')) {
        tools.push(
            new MakeCallTool({
                accountSid,
                authToken,
                maxOutputLength,
                authConfig
            })
        )
    }

    if (actions.includes('list_calls')) {
        tools.push(
            new ListCallsTool({
                accountSid,
                authToken,
                maxOutputLength,
                authConfig
            })
        )
    }

    return tools
}
