import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Azure Blob Storage API for managing containers and blobs'
export interface RequestParameters {
    name?: string
    actions?: string[]
    tenantId?: string
    clientId?: string
    clientSecret?: string
    accountName?: string
    defaultParams?: any
    maxOutputLength?: number
}
export declare function getAzureBlobStorageAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string>
export declare const createAzureBlobStorageTools: (args?: RequestParameters) => DynamicStructuredTool[]
