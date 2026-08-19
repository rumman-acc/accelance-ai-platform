import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Intercom API for managing contacts and conversations'
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
    accessToken?: string
    defaultParams?: any
}
export declare const createIntercomTools: (args?: RequestParameters) => DynamicStructuredTool[]
