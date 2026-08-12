import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Azure Key Vault API for managing secrets and keys`

const AZURE_KEY_VAULT_API_VERSION = '7.4'
const AZURE_AD_TOKEN_URL = (tenantId: string) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

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

// Fetches a fresh Azure AD access token (OAuth2 client-credentials flow) for Azure Key Vault.
// A new token is requested per tool invocation rather than cached/persisted.
export async function getAzureKeyVaultAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://vault.azure.net/.default'
    }).toString()

    const response = await secureFetch(AZURE_AD_TOKEN_URL(tenantId), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Azure AD OAuth Error ${response.status}: ${response.statusText} - ${errorText}`)
    }

    const data: any = await response.json()
    return data.access_token
}

// Define schemas for different Azure Key Vault operations
const ListSecretsSchema = z.object({})

const GetSecretSchema = z.object({
    secretName: z.string().describe('Name of the secret to retrieve')
})

const SetSecretSchema = z.object({
    secretName: z.string().describe('Name of the secret to create or update'),
    value: z.string().describe('Value of the secret')
})

const DeleteSecretSchema = z.object({
    secretName: z.string().describe('Name of the secret to delete')
})

const ListKeysSchema = z.object({})

class BaseAzureKeyVaultTool extends DynamicStructuredTool {
    protected tenantId: string = ''
    protected clientId: string = ''
    protected clientSecret: string = ''
    protected vaultName: string = ''

    constructor(args: any) {
        super(args)
        this.tenantId = args.tenantId ?? ''
        this.clientId = args.clientId ?? ''
        this.clientSecret = args.clientSecret ?? ''
        this.vaultName = args.vaultName ?? ''
    }

    async makeAzureKeyVaultRequest({
        endpoint,
        method = 'GET',
        body,
        params
    }: {
        endpoint: string
        method?: string
        body?: any
        params?: any
    }): Promise<string> {
        const accessToken = await getAzureKeyVaultAccessToken(this.tenantId, this.clientId, this.clientSecret)

        const separator = endpoint.includes('?') ? '&' : '?'
        const url = `https://${this.vaultName}.vault.azure.net${endpoint}${separator}api-version=${AZURE_KEY_VAULT_API_VERSION}`

        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Azure Key Vault API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        // Azure returns HTTP 204 with no body for successful deletes
        if (response.status === 204) {
            return 'Operation completed successfully' + TOOL_ARGS_PREFIX + JSON.stringify(params)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListSecretsTool extends BaseAzureKeyVaultTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_secrets',
            description: 'List secrets in the Azure Key Vault',
            schema: ListSecretsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            vaultName: args.vaultName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/secrets`
            const response = await this.makeAzureKeyVaultRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing secrets: ${error}`, params)
        }
    }
}

class GetSecretTool extends BaseAzureKeyVaultTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_secret',
            description: 'Get the value of a secret from Azure Key Vault',
            schema: GetSecretSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            vaultName: args.vaultName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/secrets/${params.secretName}`
            const response = await this.makeAzureKeyVaultRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting secret: ${error}`, params)
        }
    }
}

class SetSecretTool extends BaseAzureKeyVaultTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'set_secret',
            description: 'Create or update a secret in Azure Key Vault',
            schema: SetSecretSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            vaultName: args.vaultName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/secrets/${params.secretName}`
            const body = { value: params.value }
            const response = await this.makeAzureKeyVaultRequest({ endpoint, method: 'PUT', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error setting secret: ${error}`, params)
        }
    }
}

class DeleteSecretTool extends BaseAzureKeyVaultTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'delete_secret',
            description: 'Delete a secret from Azure Key Vault',
            schema: DeleteSecretSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            vaultName: args.vaultName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/secrets/${params.secretName}`
            const response = await this.makeAzureKeyVaultRequest({ endpoint, method: 'DELETE', params })
            return response
        } catch (error) {
            return formatToolError(`Error deleting secret: ${error}`, params)
        }
    }
}

class ListKeysTool extends BaseAzureKeyVaultTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_keys',
            description: 'List keys in the Azure Key Vault',
            schema: ListKeysSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            vaultName: args.vaultName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/keys`
            const response = await this.makeAzureKeyVaultRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing keys: ${error}`, params)
        }
    }
}

export const createAzureKeyVaultTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const tenantId = args?.tenantId || ''
    const clientId = args?.clientId || ''
    const clientSecret = args?.clientSecret || ''
    const vaultName = args?.vaultName || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_secrets')) {
        tools.push(new ListSecretsTool({ tenantId, clientId, clientSecret, vaultName, maxOutputLength, defaultParams }))
    }

    if (actions.includes('get_secret')) {
        tools.push(new GetSecretTool({ tenantId, clientId, clientSecret, vaultName, maxOutputLength, defaultParams }))
    }

    if (actions.includes('set_secret')) {
        tools.push(new SetSecretTool({ tenantId, clientId, clientSecret, vaultName, maxOutputLength, defaultParams }))
    }

    if (actions.includes('delete_secret')) {
        tools.push(new DeleteSecretTool({ tenantId, clientId, clientSecret, vaultName, maxOutputLength, defaultParams }))
    }

    if (actions.includes('list_keys')) {
        tools.push(new ListKeysTool({ tenantId, clientId, clientSecret, vaultName, maxOutputLength, defaultParams }))
    }

    return tools
}
