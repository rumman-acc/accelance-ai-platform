import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Microsoft Planner API for managing plans and tasks`

export interface Headers {
    [key: string]: string
}

export interface Body {
    [key: string]: any
}

export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    accessToken?: string
    defaultParams?: any
}

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'

// Define schemas for different Planner operations

const ListPlansForGroupSchema = z.object({
    groupId: z.string().describe('ID of the Microsoft 365 group that owns the plans')
})

const ListTasksSchema = z.object({
    planId: z.string().describe('ID of the plan to list tasks for')
})

const CreateTaskSchema = z.object({
    planId: z.string().describe('ID of the plan the task belongs to'),
    bucketId: z.string().describe('ID of the bucket the task belongs to'),
    title: z.string().describe('Title of the task')
})

const GetTaskSchema = z.object({
    taskId: z.string().describe('ID of the task to retrieve')
})

const UpdateTaskSchema = z.object({
    taskId: z.string().describe('ID of the task to update'),
    etag: z.string().describe("The task's current @odata.etag value, from a prior get_task call. Required for optimistic concurrency."),
    percentComplete: z.number().describe('0-100')
})

class BasePlannerTool extends DynamicStructuredTool {
    protected accessToken: string = ''

    constructor(args: any) {
        super(args)
        this.accessToken = args.accessToken ?? ''
    }

    async makeGraphRequest({
        endpoint,
        method = 'GET',
        body,
        extraHeaders
    }: {
        endpoint: string
        method?: string
        body?: any
        extraHeaders?: Headers
    }): Promise<string> {
        const url = `${GRAPH_BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...extraHeaders,
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Microsoft Planner API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        return response.text()
    }
}

// Plan Tools
class ListPlansForGroupTool extends BasePlannerTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/groups/${params.groupId}/planner/plans`
            const responseText = await this.makeGraphRequest({ endpoint })
            return responseText + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error listing plans for group: ${error}`, params)
        }
    }
}

// Task Tools
class ListTasksTool extends BasePlannerTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/planner/plans/${params.planId}/tasks`
            const responseText = await this.makeGraphRequest({ endpoint })
            return responseText + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error listing tasks: ${error}`, params)
        }
    }
}

class CreateTaskTool extends BasePlannerTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                planId: params.planId,
                bucketId: params.bucketId,
                title: params.title
            }

            const responseText = await this.makeGraphRequest({ endpoint: '/planner/tasks', method: 'POST', body })
            return responseText + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error creating task: ${error}`, params)
        }
    }
}

class GetTaskTool extends BasePlannerTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/planner/tasks/${params.taskId}`
            const responseText = await this.makeGraphRequest({ endpoint })
            return responseText + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error getting task: ${error}`, params)
        }
    }
}

class UpdateTaskTool extends BasePlannerTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
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
            return result + TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return formatToolError(`Error updating task: ${error}`, params)
        }
    }
}

export const createPlannerTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
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
