import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Asana API for managing tasks and projects`

const ASANA_BASE_URL = 'https://app.asana.com/api/1.0'

export interface RequestParameters {
    actions?: string[]
    personalAccessToken?: string
    maxOutputLength?: number
}

// Define schemas for different Asana operations

const ListTasksSchema = z.object({
    projectGid: z.string().describe('The globally unique identifier (GID) of the project to list tasks for'),
    limit: z.number().optional().default(20).describe('Maximum number of tasks to return')
})

const CreateTaskSchema = z.object({
    name: z.string().describe('Name/title of the task'),
    notes: z.string().optional().describe('Free-form textual information associated with the task'),
    projectGid: z.string().describe('The globally unique identifier (GID) of the project to add the task to')
})

const GetTaskSchema = z.object({
    taskGid: z.string().describe('The globally unique identifier (GID) of the task')
})

const UpdateTaskSchema = z.object({
    taskGid: z.string().describe('The globally unique identifier (GID) of the task'),
    completed: z.boolean().optional().describe('Whether the task is completed'),
    name: z.string().optional().describe('Updated name/title of the task'),
    notes: z.string().optional().describe('Updated free-form textual information associated with the task')
})

const ListProjectsSchema = z.object({
    workspaceGid: z.string().describe('The globally unique identifier (GID) of the workspace to list projects for'),
    limit: z.number().optional().default(20).describe('Maximum number of projects to return')
})

class BaseAsanaTool extends DynamicStructuredTool {
    protected personalAccessToken: string = ''

    constructor(args: any) {
        super(args)
        this.personalAccessToken = args.personalAccessToken ?? ''
    }

    async makeAsanaRequest({
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
        const url = `${ASANA_BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Bearer ${this.personalAccessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
            throw new Error(`Asana API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListTasksTool extends BaseAsanaTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_tasks',
            description: 'List tasks from an Asana project',
            schema: ListTasksSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const queryParams = new URLSearchParams()
            queryParams.append('project', params.projectGid)
            queryParams.append('limit', String(params.limit))

            const endpoint = `/tasks?${queryParams.toString()}`
            const response = await this.makeAsanaRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing tasks: ${error}`, params)
        }
    }
}

class CreateTaskTool extends BaseAsanaTool {
    constructor(args: any) {
        const toolInput = {
            name: 'create_task',
            description: 'Create a new task in an Asana project',
            schema: CreateTaskSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const taskData = {
                data: {
                    name: params.name,
                    notes: params.notes,
                    projects: [params.projectGid]
                }
            }

            const response = await this.makeAsanaRequest({ endpoint: '/tasks', method: 'POST', body: taskData, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating task: ${error}`, params)
        }
    }
}

class GetTaskTool extends BaseAsanaTool {
    constructor(args: any) {
        const toolInput = {
            name: 'get_task',
            description: 'Get a specific task from Asana',
            schema: GetTaskSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const endpoint = `/tasks/${params.taskGid}`
            const response = await this.makeAsanaRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting task: ${error}`, params)
        }
    }
}

class UpdateTaskTool extends BaseAsanaTool {
    constructor(args: any) {
        const toolInput = {
            name: 'update_task',
            description: 'Update an existing task in Asana',
            schema: UpdateTaskSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const fields: Record<string, any> = {}
            if (params.completed !== undefined) fields.completed = params.completed
            if (params.name !== undefined) fields.name = params.name
            if (params.notes !== undefined) fields.notes = params.notes

            const taskData = { data: fields }

            const endpoint = `/tasks/${params.taskGid}`
            const response = await this.makeAsanaRequest({ endpoint, method: 'PUT', body: taskData, params })
            return response || 'Task updated successfully'
        } catch (error) {
            return formatToolError(`Error updating task: ${error}`, params)
        }
    }
}

class ListProjectsTool extends BaseAsanaTool {
    constructor(args: any) {
        const toolInput = {
            name: 'list_projects',
            description: 'List projects from an Asana workspace',
            schema: ListProjectsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const queryParams = new URLSearchParams()
            queryParams.append('workspace', params.workspaceGid)
            queryParams.append('limit', String(params.limit))

            const endpoint = `/projects?${queryParams.toString()}`
            const response = await this.makeAsanaRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing projects: ${error}`, params)
        }
    }
}

export const createAsanaTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const personalAccessToken = args?.personalAccessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity

    if (actions.includes('list_tasks')) {
        tools.push(new ListTasksTool({ personalAccessToken, maxOutputLength }))
    }

    if (actions.includes('create_task')) {
        tools.push(new CreateTaskTool({ personalAccessToken, maxOutputLength }))
    }

    if (actions.includes('get_task')) {
        tools.push(new GetTaskTool({ personalAccessToken, maxOutputLength }))
    }

    if (actions.includes('update_task')) {
        tools.push(new UpdateTaskTool({ personalAccessToken, maxOutputLength }))
    }

    if (actions.includes('list_projects')) {
        tools.push(new ListProjectsTool({ personalAccessToken, maxOutputLength }))
    }

    return tools
}
