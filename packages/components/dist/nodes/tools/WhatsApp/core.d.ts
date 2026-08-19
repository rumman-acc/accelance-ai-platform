import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc =
    'Use this when you want to access the WhatsApp Business Cloud API for sending messages and reading business profile information'
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
export declare const createWhatsAppTools: (args?: RequestParameters) => DynamicStructuredTool[]
