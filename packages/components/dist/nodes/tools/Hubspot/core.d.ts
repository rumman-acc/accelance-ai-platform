import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access HubSpot API for managing CRM contacts and deals'
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
    privateAppToken?: string
    defaultParams?: any
}
export declare const createHubspotTools: (args?: RequestParameters) => DynamicStructuredTool[]
