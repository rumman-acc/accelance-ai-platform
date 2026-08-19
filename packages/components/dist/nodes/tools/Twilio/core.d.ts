import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to send SMS messages and make phone calls via the Twilio API'
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
export declare const createTwilioTools: (args?: RequestParameters) => DynamicStructuredTool[]
