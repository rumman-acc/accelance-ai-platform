"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDropboxTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Dropbox API for managing files and folders`;
const DROPBOX_BASE_URL = 'https://api.dropboxapi.com/2';
// Define schemas for different Dropbox operations
const ListFolderSchema = v3_1.z.object({
    path: v3_1.z.string().describe('Folder path, e.g. "" for root or "/MyFolder"')
});
const CreateFolderSchema = v3_1.z.object({
    path: v3_1.z.string().describe('Folder path to create, e.g. "/MyFolder"')
});
const DeleteSchema = v3_1.z.object({
    path: v3_1.z.string().describe('Path of the file or folder to delete')
});
const GetMetadataSchema = v3_1.z.object({
    path: v3_1.z.string().describe('Path of the file or folder to get metadata for')
});
const SearchSchema = v3_1.z.object({
    query: v3_1.z.string().describe('Search query string')
});
class BaseDropboxTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.accessToken = '';
        this.accessToken = args.accessToken ?? '';
    }
    async makeDropboxRequest({ endpoint, body, params }) {
        const url = `${DROPBOX_BASE_URL}${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method: 'POST',
            headers,
            body: JSON.stringify(body ?? {})
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dropbox API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListFolderTool extends BaseDropboxTool {
    constructor(args) {
        const toolInput = {
            name: 'list_folder',
            description: 'List the contents of a folder in Dropbox',
            schema: ListFolderSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const response = await this.makeDropboxRequest({
                endpoint: '/files/list_folder',
                body: { path: params.path },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing folder: ${error}`, params);
        }
    }
}
class CreateFolderTool extends BaseDropboxTool {
    constructor(args) {
        const toolInput = {
            name: 'create_folder',
            description: 'Create a new folder in Dropbox',
            schema: CreateFolderSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const response = await this.makeDropboxRequest({
                endpoint: '/files/create_folder_v2',
                body: { path: params.path },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating folder: ${error}`, params);
        }
    }
}
class DeleteTool extends BaseDropboxTool {
    constructor(args) {
        const toolInput = {
            name: 'delete',
            description: 'Delete a file or folder in Dropbox',
            schema: DeleteSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const response = await this.makeDropboxRequest({
                endpoint: '/files/delete_v2',
                body: { path: params.path },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting: ${error}`, params);
        }
    }
}
class GetMetadataTool extends BaseDropboxTool {
    constructor(args) {
        const toolInput = {
            name: 'get_metadata',
            description: 'Get metadata for a file or folder in Dropbox',
            schema: GetMetadataSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const response = await this.makeDropboxRequest({
                endpoint: '/files/get_metadata',
                body: { path: params.path },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting metadata: ${error}`, params);
        }
    }
}
class SearchTool extends BaseDropboxTool {
    constructor(args) {
        const toolInput = {
            name: 'search',
            description: 'Search for files and folders in Dropbox',
            schema: SearchSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const response = await this.makeDropboxRequest({
                endpoint: '/files/search_v2',
                body: { query: params.query },
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error searching: ${error}`, params);
        }
    }
}
const createDropboxTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const accessToken = args?.accessToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_folder')) {
        tools.push(new ListFolderTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('create_folder')) {
        tools.push(new CreateFolderTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('delete')) {
        tools.push(new DeleteTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_metadata')) {
        tools.push(new GetMetadataTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('search')) {
        tools.push(new SearchTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createDropboxTools = createDropboxTools;
//# sourceMappingURL=core.js.map