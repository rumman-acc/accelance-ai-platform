"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAsanaTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Asana API for managing tasks and projects`;
const ASANA_BASE_URL = 'https://app.asana.com/api/1.0';
// Define schemas for different Asana operations
const ListTasksSchema = v3_1.z.object({
    projectGid: v3_1.z.string().describe('The globally unique identifier (GID) of the project to list tasks for'),
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of tasks to return')
});
const CreateTaskSchema = v3_1.z.object({
    name: v3_1.z.string().describe('Name/title of the task'),
    notes: v3_1.z.string().optional().describe('Free-form textual information associated with the task'),
    projectGid: v3_1.z.string().describe('The globally unique identifier (GID) of the project to add the task to')
});
const GetTaskSchema = v3_1.z.object({
    taskGid: v3_1.z.string().describe('The globally unique identifier (GID) of the task')
});
const UpdateTaskSchema = v3_1.z.object({
    taskGid: v3_1.z.string().describe('The globally unique identifier (GID) of the task'),
    completed: v3_1.z.boolean().optional().describe('Whether the task is completed'),
    name: v3_1.z.string().optional().describe('Updated name/title of the task'),
    notes: v3_1.z.string().optional().describe('Updated free-form textual information associated with the task')
});
const ListProjectsSchema = v3_1.z.object({
    workspaceGid: v3_1.z.string().describe('The globally unique identifier (GID) of the workspace to list projects for'),
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of projects to return')
});
class BaseAsanaTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.personalAccessToken = '';
        this.personalAccessToken = args.personalAccessToken ?? '';
    }
    async makeAsanaRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${ASANA_BASE_URL}${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.personalAccessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
            throw new Error(`Asana API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListTasksTool extends BaseAsanaTool {
    constructor(args) {
        const toolInput = {
            name: 'list_tasks',
            description: 'List tasks from an Asana project',
            schema: ListTasksSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('project', params.projectGid);
            queryParams.append('limit', String(params.limit));
            const endpoint = `/tasks?${queryParams.toString()}`;
            const response = await this.makeAsanaRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing tasks: ${error}`, params);
        }
    }
}
class CreateTaskTool extends BaseAsanaTool {
    constructor(args) {
        const toolInput = {
            name: 'create_task',
            description: 'Create a new task in an Asana project',
            schema: CreateTaskSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const taskData = {
                data: {
                    name: params.name,
                    notes: params.notes,
                    projects: [params.projectGid]
                }
            };
            const response = await this.makeAsanaRequest({ endpoint: '/tasks', method: 'POST', body: taskData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating task: ${error}`, params);
        }
    }
}
class GetTaskTool extends BaseAsanaTool {
    constructor(args) {
        const toolInput = {
            name: 'get_task',
            description: 'Get a specific task from Asana',
            schema: GetTaskSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `/tasks/${params.taskGid}`;
            const response = await this.makeAsanaRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting task: ${error}`, params);
        }
    }
}
class UpdateTaskTool extends BaseAsanaTool {
    constructor(args) {
        const toolInput = {
            name: 'update_task',
            description: 'Update an existing task in Asana',
            schema: UpdateTaskSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const fields = {};
            if (params.completed !== undefined)
                fields.completed = params.completed;
            if (params.name !== undefined)
                fields.name = params.name;
            if (params.notes !== undefined)
                fields.notes = params.notes;
            const taskData = { data: fields };
            const endpoint = `/tasks/${params.taskGid}`;
            const response = await this.makeAsanaRequest({ endpoint, method: 'PUT', body: taskData, params });
            return response || 'Task updated successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating task: ${error}`, params);
        }
    }
}
class ListProjectsTool extends BaseAsanaTool {
    constructor(args) {
        const toolInput = {
            name: 'list_projects',
            description: 'List projects from an Asana workspace',
            schema: ListProjectsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('workspace', params.workspaceGid);
            queryParams.append('limit', String(params.limit));
            const endpoint = `/projects?${queryParams.toString()}`;
            const response = await this.makeAsanaRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing projects: ${error}`, params);
        }
    }
}
const createAsanaTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const personalAccessToken = args?.personalAccessToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    if (actions.includes('list_tasks')) {
        tools.push(new ListTasksTool({ personalAccessToken, maxOutputLength }));
    }
    if (actions.includes('create_task')) {
        tools.push(new CreateTaskTool({ personalAccessToken, maxOutputLength }));
    }
    if (actions.includes('get_task')) {
        tools.push(new GetTaskTool({ personalAccessToken, maxOutputLength }));
    }
    if (actions.includes('update_task')) {
        tools.push(new UpdateTaskTool({ personalAccessToken, maxOutputLength }));
    }
    if (actions.includes('list_projects')) {
        tools.push(new ListProjectsTool({ personalAccessToken, maxOutputLength }));
    }
    return tools;
};
exports.createAsanaTools = createAsanaTools;
//# sourceMappingURL=core.js.map