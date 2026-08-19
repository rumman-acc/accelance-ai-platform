import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Bitbucket API for managing repositories, pull requests, and issues'
export interface Headers {
    [key: string]: string
}
export interface Body {
    [key: string]: any
}
export interface BitbucketAuthConfig {
    username?: string
    appPassword?: string
}
export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    username?: string
    appPassword?: string
    defaultParams?: any
    authConfig?: BitbucketAuthConfig
}
export declare const createBitbucketTools: (args?: RequestParameters) => DynamicStructuredTool[]
