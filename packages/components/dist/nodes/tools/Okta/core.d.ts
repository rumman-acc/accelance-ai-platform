import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Okta API for managing users and groups'
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
    oktaDomain?: string
    apiToken?: string
    defaultParams?: any
}
export declare const createOktaTools: (args?: RequestParameters) => DynamicStructuredTool[]
