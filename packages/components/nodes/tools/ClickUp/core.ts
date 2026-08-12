import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access ClickUp API for managing tasks and lists`

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
    apiToken?: string
    defaultParams?: any
}

// Define schemas for different ClickUp operations

const ListTasksSchema = z.object({
    listId: z.string().describe('ID of the ClickUp list to fetch tasks from')
})

const CreateTaskSchema = z.object({
    listId: z.string().describe('ID of the ClickUp list to create the task in'),
    name: z.string().describe('Name/title of the task'),
    description: z.string().optional().describe('Description of the task'),
    priority: z.number().optional().describe('1=urgent, 2=high, 3=normal, 4=low')
})

const GetTaskSchema = z.object({
    taskId: z.string().describe('ID of the ClickUp task to retrieve')
})

const UpdateTaskSchema = z.object({
    taskId: z.string().describe('ID of the ClickUp task to update'),
    name: z.string().optional().describe('Updated name/title of the task'),
    description: z.string().optional().describe('Updated description of the task'),
    status: z.string().optional().describe('Updated status of the task')
})

const ListSpacesSchema = z.object({
    teamId: z.string().describe('ID of the ClickUp team/workspace to list spaces from')
})

const CLICKUP_BASE_URL = 'https://api.clickup.com/api/v2'

class BaseClickUpTool extends DynamicStructuredTool {
    protected apiToken: string = ''

    constructor(args: any) {
        super(args)
        this.apiToken = args.apiToken ?? ''
    }

    async makeClickUpRequest({
        endpoint,
        method = 'GET',
        body,
        params
    }: {
        endpoint: string
        method?: string
        body?: any
        params?: any
    }): Promise<string> {
        const url = `${CLICKUP_BASE_URL}${endpoint}`

        const headers = {
            Authorization: this.apiToken,
            'Content-Type': 'application/json',
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
            throw new Error(`ClickUp API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListTasksTool extends BaseClickUpTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/list/${params.listId}/task`
            const response = await this.makeClickUpRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing tasks: ${error}`, params)
        }
    }
}

class CreateTaskTool extends BaseClickUpTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const taskData: any = {
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
            return formatToolError(`Error creating task: ${error}`, params)
        }
    }
}

class GetTaskTool extends BaseClickUpTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/task/${params.taskId}`
            const response = await this.makeClickUpRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting task: ${error}`, params)
        }
    }
}

class UpdateTaskTool extends BaseClickUpTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const updateData: any = {}

            if (params.name) updateData.name = params.name
            if (params.description) updateData.description = params.description
            if (params.status) updateData.status = params.status

            const endpoint = `/task/${params.taskId}`
            const response = await this.makeClickUpRequest({ endpoint, method: 'PUT', body: updateData, params })
            return response || 'Task updated successfully'
        } catch (error) {
            return formatToolError(`Error updating task: ${error}`, params)
        }
    }
}

class ListSpacesTool extends BaseClickUpTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/team/${params.teamId}/space`
            const response = await this.makeClickUpRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing spaces: ${error}`, params)
        }
    }
}

export const createClickUpTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
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
