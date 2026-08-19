import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to manage GitLab projects, issues, and merge requests via the GitLab API'
export interface Headers {
    [key: string]: string
}
export interface Body {
    [key: string]: any
}
export interface GitLabAuthConfig {
    personalAccessToken?: string
}
export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    instanceUrl?: string
    personalAccessToken?: string
    authConfig?: GitLabAuthConfig
}
export declare const createGitLabTools: (args?: RequestParameters) => DynamicStructuredTool[]
