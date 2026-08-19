"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAzureDevOpsTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Azure DevOps API for managing projects, work items, and repositories`;
// Define schemas for different Azure DevOps operations
const ListProjectsSchema = v3_1.z.object({});
const QueryWorkItemsSchema = v3_1.z.object({
    project: v3_1.z.string(),
    wiql: v3_1.z.string().describe('WIQL query, e.g. "SELECT [System.Id] FROM WorkItems WHERE [System.State] = \'Active\'"')
});
const CreateWorkItemSchema = v3_1.z.object({
    project: v3_1.z.string(),
    workItemType: v3_1.z.string().describe('e.g. Task, Bug, User Story'),
    title: v3_1.z.string()
});
const GetWorkItemSchema = v3_1.z.object({
    project: v3_1.z.string(),
    workItemId: v3_1.z.string()
});
const ListRepositoriesSchema = v3_1.z.object({
    project: v3_1.z.string()
});
class BaseAzureDevOpsTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.organization = '';
        this.personalAccessToken = '';
        this.organization = args.organization ?? '';
        this.personalAccessToken = args.personalAccessToken ?? '';
    }
    async makeAzureDevOpsRequest({ endpoint, method = 'GET', body, contentType = 'application/json', params }) {
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `https://dev.azure.com/${this.organization}${endpoint}${separator}api-version=7.1`;
        const authHeader = `Basic ${Buffer.from(':' + this.personalAccessToken).toString('base64')}`;
        const headers = {
            Authorization: authHeader,
            'Content-Type': contentType,
            Accept: 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure DevOps API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListProjectsTool extends BaseAzureDevOpsTool {
    constructor(args) {
        const toolInput = {
            name: 'list_projects',
            description: 'List all projects in the Azure DevOps organization',
            schema: ListProjectsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/_apis/projects`;
            const response = await this.makeAzureDevOpsRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing projects: ${error}`, params);
        }
    }
}
class QueryWorkItemsTool extends BaseAzureDevOpsTool {
    constructor(args) {
        const toolInput = {
            name: 'query_work_items',
            description: 'Query work items in Azure DevOps using WIQL',
            schema: QueryWorkItemsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.project}/_apis/wit/wiql`;
            const body = { query: params.wiql };
            const response = await this.makeAzureDevOpsRequest({ endpoint, method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error querying work items: ${error}`, params);
        }
    }
}
class CreateWorkItemTool extends BaseAzureDevOpsTool {
    constructor(args) {
        const toolInput = {
            name: 'create_work_item',
            description: 'Create a new work item in Azure DevOps',
            schema: CreateWorkItemSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        };
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.project}/_apis/wit/workitems/$${params.workItemType}`;
            const body = [{ op: 'add', path: '/fields/System.Title', value: params.title }];
            const response = await this.makeAzureDevOpsRequest({
                endpoint,
                method: 'PATCH',
                body,
                contentType: 'application/json-patch+json',
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating work item: ${error}`, params);
        }
    }
}
class GetWorkItemTool extends BaseAzureDevOpsTool {
    constructor(args) {
        const toolInput = {
            name: 'get_work_item',
            description: 'Get a specific work item from Azure DevOps',
            schema: GetWorkItemSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.project}/_apis/wit/workitems/${params.workItemId}`;
            const response = await this.makeAzureDevOpsRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting work item: ${error}`, params);
        }
    }
}
class ListRepositoriesTool extends BaseAzureDevOpsTool {
    constructor(args) {
        const toolInput = {
            name: 'list_repositories',
            description: 'List Git repositories in an Azure DevOps project',
            schema: ListRepositoriesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            organization: args.organization,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.project}/_apis/git/repositories`;
            const response = await this.makeAzureDevOpsRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing repositories: ${error}`, params);
        }
    }
}
const createAzureDevOpsTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const organization = args?.organization || '';
    const personalAccessToken = args?.personalAccessToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_projects')) {
        tools.push(new ListProjectsTool({
            organization,
            personalAccessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('query_work_items')) {
        tools.push(new QueryWorkItemsTool({
            organization,
            personalAccessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('create_work_item')) {
        tools.push(new CreateWorkItemTool({
            organization,
            personalAccessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_work_item')) {
        tools.push(new GetWorkItemTool({
            organization,
            personalAccessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_repositories')) {
        tools.push(new ListRepositoriesTool({
            organization,
            personalAccessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createAzureDevOpsTools = createAzureDevOpsTools;
//# sourceMappingURL=core.js.map