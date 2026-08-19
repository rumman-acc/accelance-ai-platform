'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createClickUpTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access ClickUp API for managing tasks and lists`
// Define schemas for different ClickUp operations
const ListTasksSchema = v3_1.z.object({
    listId: v3_1.z.string().describe('ID of the ClickUp list to fetch tasks from')
})
const CreateTaskSchema = v3_1.z.object({
    listId: v3_1.z.string().describe('ID of the ClickUp list to create the task in'),
    name: v3_1.z.string().describe('Name/title of the task'),
    description: v3_1.z.string().optional().describe('Description of the task'),
    priority: v3_1.z.number().optional().describe('1=urgent, 2=high, 3=normal, 4=low')
})
const GetTaskSchema = v3_1.z.object({
    taskId: v3_1.z.string().describe('ID of the ClickUp task to retrieve')
})
const UpdateTaskSchema = v3_1.z.object({
    taskId: v3_1.z.string().describe('ID of the ClickUp task to update'),
    name: v3_1.z.string().optional().describe('Updated name/title of the task'),
    description: v3_1.z.string().optional().describe('Updated description of the task'),
    status: v3_1.z.string().optional().describe('Updated status of the task')
})
const ListSpacesSchema = v3_1.z.object({
    teamId: v3_1.z.string().describe('ID of the ClickUp team/workspace to list spaces from')
})
const CLICKUP_BASE_URL = 'https://api.clickup.com/api/v2'
class BaseClickUpTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.apiToken = ''
        this.apiToken = args.apiToken ?? ''
    }
    async makeClickUpRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${CLICKUP_BASE_URL}${endpoint}`
        const headers = {
            Authorization: this.apiToken,
            'Content-Type': 'application/json',
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
            throw new Error(`ClickUp API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListTasksTool extends BaseClickUpTool {
    constructor(args) {
        const toolInput = {
            name: 'list_tasks',
            description: 'List tasks from a ClickUp list',
            schema: ListTasksSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/list/${params.listId}/task`
            const response = await this.makeClickUpRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing tasks: ${error}`, params)
        }
    }
}
class CreateTaskTool extends BaseClickUpTool {
    constructor(args) {
        const toolInput = {
            name: 'create_task',
            description: 'Create a new task in a ClickUp list',
            schema: CreateTaskSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const taskData = {
                name: params.name,
                description: params.description
            }
            if (params.priority) {
                taskData.priority = params.priority
            }
            const endpoint = `/list/${params.listId}/task`
            const response = await this.makeClickUpRequest({ endpoint, method: 'POST', body: taskData, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating task: ${error}`, params)
        }
    }
}
class GetTaskTool extends BaseClickUpTool {
    constructor(args) {
        const toolInput = {
            name: 'get_task',
            description: 'Get a specific task from ClickUp',
            schema: GetTaskSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/task/${params.taskId}`
            const response = await this.makeClickUpRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting task: ${error}`, params)
        }
    }
}
class UpdateTaskTool extends BaseClickUpTool {
    constructor(args) {
        const toolInput = {
            name: 'update_task',
            description: 'Update an existing task in ClickUp',
            schema: UpdateTaskSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const updateData = {}
            if (params.name) updateData.name = params.name
            if (params.description) updateData.description = params.description
            if (params.status) updateData.status = params.status
            const endpoint = `/task/${params.taskId}`
            const response = await this.makeClickUpRequest({ endpoint, method: 'PUT', body: updateData, params })
            return response || 'Task updated successfully'
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error updating task: ${error}`, params)
        }
    }
}
class ListSpacesTool extends BaseClickUpTool {
    constructor(args) {
        const toolInput = {
            name: 'list_spaces',
            description: 'List spaces in a ClickUp team/workspace',
            schema: ListSpacesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/team/${params.teamId}/space`
            const response = await this.makeClickUpRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing spaces: ${error}`, params)
        }
    }
}
const createClickUpTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const apiToken = args?.apiToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('list_tasks')) {
        tools.push(
            new ListTasksTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('create_task')) {
        tools.push(
            new CreateTaskTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('get_task')) {
        tools.push(
            new GetTaskTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('update_task')) {
        tools.push(
            new UpdateTaskTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_spaces')) {
        tools.push(
            new ListSpacesTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    return tools
}
exports.createClickUpTools = createClickUpTools
//# sourceMappingURL=core.js.map
