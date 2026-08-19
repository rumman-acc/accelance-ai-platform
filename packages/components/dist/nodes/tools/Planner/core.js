'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createPlannerTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Microsoft Planner API for managing plans and tasks`
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'
// Define schemas for different Planner operations
const ListPlansForGroupSchema = v3_1.z.object({
    groupId: v3_1.z.string().describe('ID of the Microsoft 365 group that owns the plans')
})
const ListTasksSchema = v3_1.z.object({
    planId: v3_1.z.string().describe('ID of the plan to list tasks for')
})
const CreateTaskSchema = v3_1.z.object({
    planId: v3_1.z.string().describe('ID of the plan the task belongs to'),
    bucketId: v3_1.z.string().describe('ID of the bucket the task belongs to'),
    title: v3_1.z.string().describe('Title of the task')
})
const GetTaskSchema = v3_1.z.object({
    taskId: v3_1.z.string().describe('ID of the task to retrieve')
})
const UpdateTaskSchema = v3_1.z.object({
    taskId: v3_1.z.string().describe('ID of the task to update'),
    etag: v3_1.z
        .string()
        .describe("The task's current @odata.etag value, from a prior get_task call. Required for optimistic concurrency."),
    percentComplete: v3_1.z.number().describe('0-100')
})
class BasePlannerTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.accessToken = ''
        this.accessToken = args.accessToken ?? ''
    }
    async makeGraphRequest({ endpoint, method = 'GET', body, extraHeaders }) {
        const url = `${GRAPH_BASE_URL}${endpoint}`
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...extraHeaders,
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Microsoft Planner API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        return response.text()
    }
}
// Plan Tools
class ListPlansForGroupTool extends BasePlannerTool {
    constructor(args) {
        const toolInput = {
            name: 'list_plans_for_group',
            description: 'List Microsoft Planner plans owned by a Microsoft 365 group',
            schema: ListPlansForGroupSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/groups/${params.groupId}/planner/plans`
            const responseText = await this.makeGraphRequest({ endpoint })
            return responseText + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing plans for group: ${error}`, params)
        }
    }
}
// Task Tools
class ListTasksTool extends BasePlannerTool {
    constructor(args) {
        const toolInput = {
            name: 'list_tasks',
            description: 'List tasks belonging to a Microsoft Planner plan',
            schema: ListTasksSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/planner/plans/${params.planId}/tasks`
            const responseText = await this.makeGraphRequest({ endpoint })
            return responseText + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing tasks: ${error}`, params)
        }
    }
}
class CreateTaskTool extends BasePlannerTool {
    constructor(args) {
        const toolInput = {
            name: 'create_task',
            description: 'Create a new task in a Microsoft Planner plan bucket',
            schema: CreateTaskSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                planId: params.planId,
                bucketId: params.bucketId,
                title: params.title
            }
            const responseText = await this.makeGraphRequest({ endpoint: '/planner/tasks', method: 'POST', body })
            return responseText + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating task: ${error}`, params)
        }
    }
}
class GetTaskTool extends BasePlannerTool {
    constructor(args) {
        const toolInput = {
            name: 'get_task',
            description: 'Get a specific Microsoft Planner task by ID',
            schema: GetTaskSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/planner/tasks/${params.taskId}`
            const responseText = await this.makeGraphRequest({ endpoint })
            return responseText + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting task: ${error}`, params)
        }
    }
}
class UpdateTaskTool extends BasePlannerTool {
    constructor(args) {
        const toolInput = {
            name: 'update_task',
            description:
                "Update a Microsoft Planner task (e.g. its percent complete). Requires the task's current @odata.etag value, obtained from a prior get_task call, for optimistic concurrency.",
            schema: UpdateTaskSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                percentComplete: params.percentComplete
            }
            const endpoint = `/planner/tasks/${params.taskId}`
            const responseText = await this.makeGraphRequest({
                endpoint,
                method: 'PATCH',
                body,
                extraHeaders: { 'If-Match': params.etag }
            })
            const result = responseText || 'Task updated successfully'
            return result + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error updating task: ${error}`, params)
        }
    }
}
const createPlannerTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('list_plans_for_group')) {
        tools.push(
            new ListPlansForGroupTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_tasks')) {
        tools.push(
            new ListTasksTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('create_task')) {
        tools.push(
            new CreateTaskTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('get_task')) {
        tools.push(
            new GetTaskTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('update_task')) {
        tools.push(
            new UpdateTaskTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    return tools
}
exports.createPlannerTools = createPlannerTools
//# sourceMappingURL=core.js.map
