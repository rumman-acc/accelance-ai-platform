import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Microsoft Entra ID (Azure AD) API for managing directory users and groups'
export interface RequestParameters {
    name?: string
    actions?: string[]
    tenantId?: string
    clientId?: string
    clientSecret?: string
    defaultParams?: any
    maxOutputLength?: number
}
export declare function getEntraIdAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string>
export declare const createEntraIdTools: (args?: RequestParameters) => DynamicStructuredTool[]
