import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Zendesk API for managing support tickets'
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
    subdomain?: string
    email?: string
    apiToken?: string
    defaultParams?: any
}
export declare const createZendeskTools: (args?: RequestParameters) => DynamicStructuredTool[]
