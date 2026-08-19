import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Mixpanel API for sending analytics events and setting user profiles'
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
    projectToken?: string
    defaultParams?: any
}
export declare const createMixpanelTools: (args?: RequestParameters) => DynamicStructuredTool[]
