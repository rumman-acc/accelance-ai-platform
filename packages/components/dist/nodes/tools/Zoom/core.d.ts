import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Zoom API for managing meetings and users'
export interface RequestParameters {
    name?: string
    actions?: string[]
    accountId?: string
    clientId?: string
    clientSecret?: string
    defaultParams?: any
    maxOutputLength?: number
}
export declare function getZoomAccessToken(accountId: string, clientId: string, clientSecret: string): Promise<string>
export declare const createZoomTools: (args?: RequestParameters) => DynamicStructuredTool[]
