import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Asana API for managing tasks and projects'
export interface RequestParameters {
    actions?: string[]
    personalAccessToken?: string
    maxOutputLength?: number
}
export declare const createAsanaTools: (args?: RequestParameters) => DynamicStructuredTool[]
