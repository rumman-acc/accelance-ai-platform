"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCircleCITools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to trigger and inspect CircleCI pipelines and workflows`;
const CIRCLECI_BASE_URL = 'https://circleci.com/api/v2';
// Schemas for CircleCI operations
const ListPipelinesSchema = v3_1.z.object({
    projectSlug: v3_1.z.string().describe('e.g. gh/org-name/repo-name')
});
const TriggerPipelineSchema = v3_1.z.object({
    projectSlug: v3_1.z.string().describe('e.g. gh/org-name/repo-name'),
    branch: v3_1.z.string().describe('Branch to trigger the pipeline on')
});
const GetPipelineSchema = v3_1.z.object({
    pipelineId: v3_1.z.string().describe('ID of the pipeline')
});
const ListWorkflowsSchema = v3_1.z.object({
    pipelineId: v3_1.z.string().describe('ID of the pipeline')
});
const GetWorkflowSchema = v3_1.z.object({
    workflowId: v3_1.z.string().describe('ID of the workflow')
});
class BaseCircleCITool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.apiToken = '';
        this.apiToken = args.apiToken ?? '';
    }
    async makeCircleCIRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${CIRCLECI_BASE_URL}${endpoint}`;
        const headers = {
            'Circle-Token': this.apiToken,
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
            throw new Error(`CircleCI API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListPipelinesTool extends BaseCircleCITool {
    constructor(args) {
        const toolInput = {
            name: 'list_pipelines',
            description: 'List pipelines for a CircleCI project',
            schema: ListPipelinesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/project/${params.projectSlug}/pipeline`;
            const response = await this.makeCircleCIRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing pipelines: ${error}`, params);
        }
    }
}
class TriggerPipelineTool extends BaseCircleCITool {
    constructor(args) {
        const toolInput = {
            name: 'trigger_pipeline',
            description: 'Trigger a new pipeline for a CircleCI project',
            schema: TriggerPipelineSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/project/${params.projectSlug}/pipeline`;
            const body = { branch: params.branch };
            const response = await this.makeCircleCIRequest({ endpoint, method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error triggering pipeline: ${error}`, params);
        }
    }
}
class GetPipelineTool extends BaseCircleCITool {
    constructor(args) {
        const toolInput = {
            name: 'get_pipeline',
            description: 'Get a specific pipeline from CircleCI',
            schema: GetPipelineSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/pipeline/${params.pipelineId}`;
            const response = await this.makeCircleCIRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting pipeline: ${error}`, params);
        }
    }
}
class ListWorkflowsTool extends BaseCircleCITool {
    constructor(args) {
        const toolInput = {
            name: 'list_workflows',
            description: 'List workflows for a CircleCI pipeline',
            schema: ListWorkflowsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/pipeline/${params.pipelineId}/workflow`;
            const response = await this.makeCircleCIRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing workflows: ${error}`, params);
        }
    }
}
class GetWorkflowTool extends BaseCircleCITool {
    constructor(args) {
        const toolInput = {
            name: 'get_workflow',
            description: 'Get a specific workflow from CircleCI',
            schema: GetWorkflowSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/workflow/${params.workflowId}`;
            const response = await this.makeCircleCIRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting workflow: ${error}`, params);
        }
    }
}
const createCircleCITools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const apiToken = args?.apiToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_pipelines')) {
        tools.push(new ListPipelinesTool({
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('trigger_pipeline')) {
        tools.push(new TriggerPipelineTool({
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_pipeline')) {
        tools.push(new GetPipelineTool({
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_workflows')) {
        tools.push(new ListWorkflowsTool({
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_workflow')) {
        tools.push(new GetWorkflowTool({
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createCircleCITools = createCircleCITools;
//# sourceMappingURL=core.js.map