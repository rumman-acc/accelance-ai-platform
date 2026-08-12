import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access the WhatsApp Business Cloud API for sending messages and reading business profile information`

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0'

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
    phoneNumberId?: string
    accessToken?: string
    defaultParams?: any
}

// Define schemas for different WhatsApp operations

const SendTextMessageSchema = z.object({
    to: z.string().describe('Recipient phone number with country code, no +, e.g. 15551234567'),
    message: z.string().describe('Text message content to send')
})

const SendTemplateMessageSchema = z.object({
    to: z.string().describe('Recipient phone number with country code, no +, e.g. 15551234567'),
    templateName: z.string().describe('Name of the approved message template'),
    languageCode: z.string().optional().default('en_US').describe('Language/locale code of the template, e.g. en_US')
})

const MarkMessageReadSchema = z.object({
    messageId: z.string().describe('ID of the message to mark as read')
})

const GetMediaUrlSchema = z.object({
    mediaId: z.string().describe('ID of the media object to retrieve the URL for')
})

const GetBusinessProfileSchema = z.object({})

class BaseWhatsAppTool extends DynamicStructuredTool {
    protected phoneNumberId: string = ''
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.phoneNumberId = args.phoneNumberId ?? ''
        this.accessToken = args.accessToken ?? ''
    }

    async makeWhatsAppRequest({
        url,
        method = 'GET',
        body,
        params
    }: {
        url: string
        method?: string
        body?: any
        params?: any
    }): Promise<string> {
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
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
            throw new Error(`WhatsApp API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

// Tools
class SendTextMessageTool extends BaseWhatsAppTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'send_text_message',
            description: 'Send a plain text message via WhatsApp Business',
            schema: SendTextMessageSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            phoneNumberId: args.phoneNumberId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'text',
                text: { body: params.message }
            }

            const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/messages`
            const response = await this.makeWhatsAppRequest({ url, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error sending text message: ${error}`, params)
        }
    }
}

class SendTemplateMessageTool extends BaseWhatsAppTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'send_template_message',
            description: 'Send a pre-approved template message via WhatsApp Business',
            schema: SendTemplateMessageSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            phoneNumberId: args.phoneNumberId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'template',
                template: {
                    name: params.templateName,
                    language: { code: params.languageCode }
                }
            }

            const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/messages`
            const response = await this.makeWhatsAppRequest({ url, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error sending template message: ${error}`, params)
        }
    }
}

class MarkMessageReadTool extends BaseWhatsAppTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'mark_message_read',
            description: 'Mark a received WhatsApp message as read',
            schema: MarkMessageReadSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            phoneNumberId: args.phoneNumberId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: params.messageId
            }

            const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/messages`
            const response = await this.makeWhatsAppRequest({ url, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error marking message as read: ${error}`, params)
        }
    }
}

class GetMediaUrlTool extends BaseWhatsAppTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_media_url',
            description: 'Get the download URL for a WhatsApp media object by its media ID',
            schema: GetMediaUrlSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            phoneNumberId: args.phoneNumberId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            // Media retrieval is scoped by media ID directly off the base graph URL,
            // not under the phone number ID
            const url = `${GRAPH_API_BASE}/${params.mediaId}`
            const response = await this.makeWhatsAppRequest({ url, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting media URL: ${error}`, params)
        }
    }
}

class GetBusinessProfileTool extends BaseWhatsAppTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_business_profile',
            description: 'Get the WhatsApp Business profile information',
            schema: GetBusinessProfileSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            phoneNumberId: args.phoneNumberId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`
            const response = await this.makeWhatsAppRequest({ url, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting business profile: ${error}`, params)
        }
    }
}

export const createWhatsAppTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const phoneNumberId = args?.phoneNumberId || ''
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('send_text_message')) {
        tools.push(
            new SendTextMessageTool({
                phoneNumberId,
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('send_template_message')) {
        tools.push(
            new SendTemplateMessageTool({
                phoneNumberId,
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('mark_message_read')) {
        tools.push(
            new MarkMessageReadTool({
                phoneNumberId,
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_media_url')) {
        tools.push(
            new GetMediaUrlTool({
                phoneNumberId,
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_business_profile')) {
        tools.push(
            new GetBusinessProfileTool({
                phoneNumberId,
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
