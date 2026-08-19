import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
export declare const desc = 'Use this when you want to access Azure Key Vault API for managing secrets and keys'
export interface RequestParameters {
    name?: string
    actions?: string[]
    tenantId?: string
    clientId?: string
    clientSecret?: string
    vaultName?: string
    defaultParams?: any
    maxOutputLength?: number
}
export declare function getAzureKeyVaultAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string>
export declare const createAzureKeyVaultTools: (args?: RequestParameters) => DynamicStructuredTool[]
