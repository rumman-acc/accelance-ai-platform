"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVercelTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Vercel API for managing deployments and projects`;
// Define schemas for different Vercel operations
const ListDeploymentsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of deployments to return')
});
const GetDeploymentSchema = v3_1.z.object({
    deploymentId: v3_1.z.string().describe('ID of the deployment to retrieve')
});
const ListProjectsSchema = v3_1.z.object({});
const CreateDeploymentSchema = v3_1.z.object({
    name: v3_1.z.string().describe('Name for the deployment'),
    projectName: v3_1.z.string().describe('Name of the project to deploy to'),
    target: v3_1.z.string().optional().default('production').describe('Deployment target environment (e.g. production, staging)')
});
const DeleteDeploymentSchema = v3_1.z.object({
    deploymentId: v3_1.z.string().describe('ID of the deployment to delete')
});
class BaseVercelTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.apiToken = '';
        this.teamId = '';
        this.apiToken = args.apiToken ?? '';
        this.teamId = args.teamId ?? '';
    }
    async makeVercelRequest({ endpoint, method = 'GET', body, params }) {
        let url = `https://api.vercel.com${endpoint}`;
        if (this.teamId) {
            url += url.includes('?') ? `&teamId=${this.teamId}` : `?teamId=${this.teamId}`;
        }
        const headers = {
            Authorization: `Bearer ${this.apiToken}`,
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
            throw new Error(`Vercel API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListDeploymentsTool extends BaseVercelTool {
    constructor(args) {
        const toolInput = {
            name: 'list_deployments',
            description: 'List deployments from Vercel',
            schema: ListDeploymentsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const limit = params.limit ?? 20;
            const endpoint = `/v6/deployments?limit=${limit}`;
            const response = await this.makeVercelRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing deployments: ${error}`, params);
        }
    }
}
class GetDeploymentTool extends BaseVercelTool {
    constructor(args) {
        const toolInput = {
            name: 'get_deployment',
            description: 'Get a specific deployment from Vercel',
            schema: GetDeploymentSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/v13/deployments/${params.deploymentId}`;
            const response = await this.makeVercelRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting deployment: ${error}`, params);
        }
    }
}
class ListProjectsTool extends BaseVercelTool {
    constructor(args) {
        const toolInput = {
            name: 'list_projects',
            description: 'List projects from Vercel',
            schema: ListProjectsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/v9/projects`;
            const response = await this.makeVercelRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing projects: ${error}`, params);
        }
    }
}
class CreateDeploymentTool extends BaseVercelTool {
    constructor(args) {
        const toolInput = {
            name: 'create_deployment',
            description: 'Create a new deployment in Vercel',
            schema: CreateDeploymentSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const deploymentData = {
                name: params.name,
                project: params.projectName,
                target: params.target ?? 'production'
            };
            const endpoint = `/v13/deployments`;
            const response = await this.makeVercelRequest({ endpoint, method: 'POST', body: deploymentData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating deployment: ${error}`, params);
        }
    }
}
class DeleteDeploymentTool extends BaseVercelTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_deployment',
            description: 'Delete a deployment from Vercel',
            schema: DeleteDeploymentSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            teamId: args.teamId,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/v13/deployments/${params.deploymentId}`;
            const response = await this.makeVercelRequest({ endpoint, method: 'DELETE', params });
            return response || 'Deployment deleted successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting deployment: ${error}`, params);
        }
    }
}
const createVercelTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const apiToken = args?.apiToken || '';
    const teamId = args?.teamId || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_deployments')) {
        tools.push(new ListDeploymentsTool({
            apiToken,
            teamId,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_deployment')) {
        tools.push(new GetDeploymentTool({
            apiToken,
            teamId,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_projects')) {
        tools.push(new ListProjectsTool({
            apiToken,
            teamId,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('create_deployment')) {
        tools.push(new CreateDeploymentTool({
            apiToken,
            teamId,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('delete_deployment')) {
        tools.push(new DeleteDeploymentTool({
            apiToken,
            teamId,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createVercelTools = createVercelTools;
//# sourceMappingURL=core.js.map