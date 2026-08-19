import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Airtable API for reading and writing records in a base'
export interface Headers {
    [key: string]: string
}
export interface Body {
    [key: string]: any
}
export interface AirtableAuthConfig {
    personalAccessToken: string
}
export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    personalAccessToken?: string
    baseId?: string
    tableName?: string
    defaultParams?: any
    authConfig?: AirtableAuthConfig
}
export declare const createAirtableTools: (args?: RequestParameters) => DynamicStructuredTool[]
