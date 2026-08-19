import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this to delegate a step to Claude as a callable sub-agent from within a flow'
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
    model?: string
    maxTokens?: number
    apiKey?: string
}
export declare const createClaudeAgentTools: (args?: RequestParameters) => DynamicStructuredTool[]
