import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Microsoft Planner API for managing plans and tasks'
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
export declare const createPlannerTools: (args?: RequestParameters) => DynamicStructuredTool[]
