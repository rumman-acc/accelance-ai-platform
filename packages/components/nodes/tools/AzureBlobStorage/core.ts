import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Azure Blob Storage API for managing containers and blobs`

const AZURE_BLOB_STORAGE_API_VERSION = '2021-08-06'
const AZURE_AD_TOKEN_URL = (tenantId: string) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

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

// Fetches a fresh Azure AD access token (OAuth2 client-credentials flow) for Azure Storage.
// A new token is requested per tool invocation rather than cached/persisted.
export async function getAzureBlobStorageAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://storage.azure.com/.default'
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

// Define schemas for different Azure Blob Storage operations
const ListContainersSchema = z.object({})

const ListBlobsSchema = z.object({
    containerName: z.string().describe('Name of the container to list blobs from')
})

const GetBlobSchema = z.object({
    containerName: z.string().describe('Name of the container'),
    blobName: z.string().describe('Name of the blob to retrieve')
})

const UploadBlobSchema = z.object({
    containerName: z.string().describe('Name of the container'),
    blobName: z.string().describe('Name of the blob to upload'),
    content: z.string().describe('Raw text content to upload as the blob')
})

const DeleteBlobSchema = z.object({
    containerName: z.string().describe('Name of the container'),
    blobName: z.string().describe('Name of the blob to delete')
})

class BaseAzureBlobStorageTool extends DynamicStructuredTool {
    protected tenantId: string = ''
    protected clientId: string = ''
    protected clientSecret: string = ''
    protected accountName: string = ''

    constructor(args: any) {
        super(args)
        this.tenantId = args.tenantId ?? ''
        this.clientId = args.clientId ?? ''
        this.clientSecret = args.clientSecret ?? ''
        this.accountName = args.accountName ?? ''
    }

    async makeAzureBlobStorageRequest({
        endpoint,
        method = 'GET',
        body,
        extraHeaders,
        params
    }: {
        endpoint: string
        method?: string
        body?: any
        extraHeaders?: Record<string, string>
        params?: any
    }): Promise<string> {
        const accessToken = await getAzureBlobStorageAccessToken(this.tenantId, this.clientId, this.clientSecret)

        const url = `https://${this.accountName}.blob.core.windows.net${endpoint}`

        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'x-ms-version': AZURE_BLOB_STORAGE_API_VERSION,
            ...this.headers,
            ...extraHeaders
        }

        const fetchOptions: any = {
            method,
            headers,
            body
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Azure Blob Storage API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        // Azure returns HTTP 202/204 with no body for successful deletes/uploads
        if (response.status === 202 || response.status === 204) {
            return 'Operation completed successfully' + TOOL_ARGS_PREFIX + JSON.stringify(params)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListContainersTool extends BaseAzureBlobStorageTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_containers',
            description: 'List containers in the Azure Blob Storage account',
            schema: ListContainersSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/?comp=list`
            const response = await this.makeAzureBlobStorageRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing containers: ${error}`, params)
        }
    }
}

class ListBlobsTool extends BaseAzureBlobStorageTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_blobs',
            description: 'List blobs within a container in Azure Blob Storage',
            schema: ListBlobsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.containerName}?restype=container&comp=list`
            const response = await this.makeAzureBlobStorageRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing blobs: ${error}`, params)
        }
    }
}

class GetBlobTool extends BaseAzureBlobStorageTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_blob',
            description: 'Get the contents of a blob from Azure Blob Storage',
            schema: GetBlobSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.containerName}/${params.blobName}`
            const response = await this.makeAzureBlobStorageRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting blob: ${error}`, params)
        }
    }
}

class UploadBlobTool extends BaseAzureBlobStorageTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'upload_blob',
            description: 'Upload a blob (block blob) to Azure Blob Storage',
            schema: UploadBlobSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.containerName}/${params.blobName}`
            const response = await this.makeAzureBlobStorageRequest({
                endpoint,
                method: 'PUT',
                body: params.content,
                extraHeaders: { 'x-ms-blob-type': 'BlockBlob' },
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error uploading blob: ${error}`, params)
        }
    }
}

class DeleteBlobTool extends BaseAzureBlobStorageTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'delete_blob',
            description: 'Delete a blob from Azure Blob Storage',
            schema: DeleteBlobSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/${params.containerName}/${params.blobName}`
            const response = await this.makeAzureBlobStorageRequest({ endpoint, method: 'DELETE', params })
            return response
        } catch (error) {
            return formatToolError(`Error deleting blob: ${error}`, params)
        }
    }
}

export const createAzureBlobStorageTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const tenantId = args?.tenantId || ''
    const clientId = args?.clientId || ''
    const clientSecret = args?.clientSecret || ''
    const accountName = args?.accountName || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_containers')) {
        tools.push(new ListContainersTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }))
    }

    if (actions.includes('list_blobs')) {
        tools.push(new ListBlobsTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }))
    }

    if (actions.includes('get_blob')) {
        tools.push(new GetBlobTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }))
    }

    if (actions.includes('upload_blob')) {
        tools.push(new UploadBlobTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }))
    }

    if (actions.includes('delete_blob')) {
        tools.push(new DeleteBlobTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }))
    }

    return tools
}
