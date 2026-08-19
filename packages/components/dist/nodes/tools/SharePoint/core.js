"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSharePointTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access SharePoint API for managing sites, lists, and files`;
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
// Define schemas for different SharePoint operations
const GetSiteSchema = v3_1.z.object({
    siteId: v3_1.z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team')
});
const ListListsSchema = v3_1.z.object({
    siteId: v3_1.z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team')
});
const ListListItemsSchema = v3_1.z.object({
    siteId: v3_1.z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team'),
    listId: v3_1.z.string().describe('ID of the list')
});
const CreateListItemSchema = v3_1.z.object({
    siteId: v3_1.z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team'),
    listId: v3_1.z.string().describe('ID of the list'),
    fieldsJson: v3_1.z.record(v3_1.z.any()).describe('Field name/value pairs matching the list columns')
});
const ListDriveItemsSchema = v3_1.z.object({
    siteId: v3_1.z.string().describe('Graph site ID, or hostname:/path syntax like contoso.sharepoint.com:/sites/team')
});
class BaseSharePointTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.accessToken = '';
        this.accessToken = args.accessToken ?? '';
    }
    async makeSharePointRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${GRAPH_BASE_URL}${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SharePoint API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class GetSiteTool extends BaseSharePointTool {
    constructor(args) {
        const toolInput = {
            name: 'get_site',
            description: 'Get a SharePoint site by ID',
            schema: GetSiteSchema,
            baseUrl: '',
            method: 'GET',
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
            const endpoint = `/sites/${params.siteId}`;
            const response = await this.makeSharePointRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting site: ${error}`, params);
        }
    }
}
class ListListsTool extends BaseSharePointTool {
    constructor(args) {
        const toolInput = {
            name: 'list_lists',
            description: 'List the lists in a SharePoint site',
            schema: ListListsSchema,
            baseUrl: '',
            method: 'GET',
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
            const endpoint = `/sites/${params.siteId}/lists`;
            const response = await this.makeSharePointRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing lists: ${error}`, params);
        }
    }
}
class ListListItemsTool extends BaseSharePointTool {
    constructor(args) {
        const toolInput = {
            name: 'list_list_items',
            description: 'List the items in a SharePoint list',
            schema: ListListItemsSchema,
            baseUrl: '',
            method: 'GET',
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
            const endpoint = `/sites/${params.siteId}/lists/${params.listId}/items?expand=fields`;
            const response = await this.makeSharePointRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing list items: ${error}`, params);
        }
    }
}
class CreateListItemTool extends BaseSharePointTool {
    constructor(args) {
        const toolInput = {
            name: 'create_list_item',
            description: 'Create a new item in a SharePoint list',
            schema: CreateListItemSchema,
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
            const endpoint = `/sites/${params.siteId}/lists/${params.listId}/items`;
            const body = { fields: params.fieldsJson };
            const response = await this.makeSharePointRequest({ endpoint, method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating list item: ${error}`, params);
        }
    }
}
class ListDriveItemsTool extends BaseSharePointTool {
    constructor(args) {
        const toolInput = {
            name: 'list_drive_items',
            description: "List the items in a SharePoint site's default document library",
            schema: ListDriveItemsSchema,
            baseUrl: '',
            method: 'GET',
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
            const endpoint = `/sites/${params.siteId}/drive/root/children`;
            const response = await this.makeSharePointRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing drive items: ${error}`, params);
        }
    }
}
const createSharePointTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const accessToken = args?.accessToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('get_site')) {
        tools.push(new GetSiteTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_lists')) {
        tools.push(new ListListsTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_list_items')) {
        tools.push(new ListListItemsTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('create_list_item')) {
        tools.push(new CreateListItemTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_drive_items')) {
        tools.push(new ListDriveItemsTool({
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createSharePointTools = createSharePointTools;
//# sourceMappingURL=core.js.map