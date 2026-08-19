"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAzureBlobStorageTools = exports.desc = void 0;
exports.getAzureBlobStorageAccessToken = getAzureBlobStorageAccessToken;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Azure Blob Storage API for managing containers and blobs`;
const AZURE_BLOB_STORAGE_API_VERSION = '2021-08-06';
const AZURE_AD_TOKEN_URL = (tenantId) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
// Fetches a fresh Azure AD access token (OAuth2 client-credentials flow) for Azure Storage.
// A new token is requested per tool invocation rather than cached/persisted.
async function getAzureBlobStorageAccessToken(tenantId, clientId, clientSecret) {
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://storage.azure.com/.default'
    }).toString();
    const response = await (0, httpSecurity_1.secureFetch)(AZURE_AD_TOKEN_URL(tenantId), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure AD OAuth Error ${response.status}: ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    return data.access_token;
}
// Define schemas for different Azure Blob Storage operations
const ListContainersSchema = v3_1.z.object({});
const ListBlobsSchema = v3_1.z.object({
    containerName: v3_1.z.string().describe('Name of the container to list blobs from')
});
const GetBlobSchema = v3_1.z.object({
    containerName: v3_1.z.string().describe('Name of the container'),
    blobName: v3_1.z.string().describe('Name of the blob to retrieve')
});
const UploadBlobSchema = v3_1.z.object({
    containerName: v3_1.z.string().describe('Name of the container'),
    blobName: v3_1.z.string().describe('Name of the blob to upload'),
    content: v3_1.z.string().describe('Raw text content to upload as the blob')
});
const DeleteBlobSchema = v3_1.z.object({
    containerName: v3_1.z.string().describe('Name of the container'),
    blobName: v3_1.z.string().describe('Name of the blob to delete')
});
class BaseAzureBlobStorageTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.tenantId = '';
        this.clientId = '';
        this.clientSecret = '';
        this.accountName = '';
        this.tenantId = args.tenantId ?? '';
        this.clientId = args.clientId ?? '';
        this.clientSecret = args.clientSecret ?? '';
        this.accountName = args.accountName ?? '';
    }
    async makeAzureBlobStorageRequest({ endpoint, method = 'GET', body, extraHeaders, params }) {
        const accessToken = await getAzureBlobStorageAccessToken(this.tenantId, this.clientId, this.clientSecret);
        const url = `https://${this.accountName}.blob.core.windows.net${endpoint}`;
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'x-ms-version': AZURE_BLOB_STORAGE_API_VERSION,
            ...this.headers,
            ...extraHeaders
        };
        const fetchOptions = {
            method,
            headers,
            body
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure Blob Storage API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        // Azure returns HTTP 202/204 with no body for successful deletes/uploads
        if (response.status === 202 || response.status === 204) {
            return 'Operation completed successfully' + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListContainersTool extends BaseAzureBlobStorageTool {
    constructor(args) {
        const toolInput = {
            name: 'list_containers',
            description: 'List containers in the Azure Blob Storage account',
            schema: ListContainersSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/?comp=list`;
            const response = await this.makeAzureBlobStorageRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing containers: ${error}`, params);
        }
    }
}
class ListBlobsTool extends BaseAzureBlobStorageTool {
    constructor(args) {
        const toolInput = {
            name: 'list_blobs',
            description: 'List blobs within a container in Azure Blob Storage',
            schema: ListBlobsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.containerName}?restype=container&comp=list`;
            const response = await this.makeAzureBlobStorageRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing blobs: ${error}`, params);
        }
    }
}
class GetBlobTool extends BaseAzureBlobStorageTool {
    constructor(args) {
        const toolInput = {
            name: 'get_blob',
            description: 'Get the contents of a blob from Azure Blob Storage',
            schema: GetBlobSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.containerName}/${params.blobName}`;
            const response = await this.makeAzureBlobStorageRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting blob: ${error}`, params);
        }
    }
}
class UploadBlobTool extends BaseAzureBlobStorageTool {
    constructor(args) {
        const toolInput = {
            name: 'upload_blob',
            description: 'Upload a blob (block blob) to Azure Blob Storage',
            schema: UploadBlobSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.containerName}/${params.blobName}`;
            const response = await this.makeAzureBlobStorageRequest({
                endpoint,
                method: 'PUT',
                body: params.content,
                extraHeaders: { 'x-ms-blob-type': 'BlockBlob' },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error uploading blob: ${error}`, params);
        }
    }
}
class DeleteBlobTool extends BaseAzureBlobStorageTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_blob',
            description: 'Delete a blob from Azure Blob Storage',
            schema: DeleteBlobSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            accountName: args.accountName,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.containerName}/${params.blobName}`;
            const response = await this.makeAzureBlobStorageRequest({ endpoint, method: 'DELETE', params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting blob: ${error}`, params);
        }
    }
}
const createAzureBlobStorageTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const tenantId = args?.tenantId || '';
    const clientId = args?.clientId || '';
    const clientSecret = args?.clientSecret || '';
    const accountName = args?.accountName || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_containers')) {
        tools.push(new ListContainersTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }));
    }
    if (actions.includes('list_blobs')) {
        tools.push(new ListBlobsTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }));
    }
    if (actions.includes('get_blob')) {
        tools.push(new GetBlobTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }));
    }
    if (actions.includes('upload_blob')) {
        tools.push(new UploadBlobTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }));
    }
    if (actions.includes('delete_blob')) {
        tools.push(new DeleteBlobTool({ tenantId, clientId, clientSecret, accountName, maxOutputLength, defaultParams }));
    }
    return tools;
};
exports.createAzureBlobStorageTools = createAzureBlobStorageTools;
//# sourceMappingURL=core.js.map