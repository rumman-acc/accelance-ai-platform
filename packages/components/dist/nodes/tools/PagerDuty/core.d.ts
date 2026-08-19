import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access PagerDuty API for managing incidents and services'
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
    apiToken?: string
    defaultParams?: any
}
export declare const createPagerDutyTools: (args?: RequestParameters) => DynamicStructuredTool[]
