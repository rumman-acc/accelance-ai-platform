import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Okta API for managing users and groups`

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
    oktaDomain?: string
    apiToken?: string
    defaultParams?: any
}

// Define schemas for different Okta operations

const ListUsersSchema = z.object({
    limit: z.number().optional().default(25).describe('Maximum number of users to return')
})

const GetUserSchema = z.object({
    userId: z.string().describe('Okta user ID, login, or email')
})

const CreateUserSchema = z.object({
    firstName: z.string().describe('First name of the user'),
    lastName: z.string().describe('Last name of the user'),
    email: z.string().describe('Email address of the user'),
    password: z.string().describe('Password to assign to the new user')
})

const ListGroupsSchema = z.object({
    limit: z.number().optional().default(25).describe('Maximum number of groups to return')
})

const AddUserToGroupSchema = z.object({
    groupId: z.string().describe('Okta group ID'),
    userId: z.string().describe('Okta user ID')
})

class BaseOktaTool extends DynamicStructuredTool {
    protected oktaDomain: string = ''
    protected apiToken: string = ''

    constructor(args: any) {
        super(args)
        this.oktaDomain = args.oktaDomain ?? ''
        this.apiToken = args.apiToken ?? ''
    }

    async makeOktaRequest({
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
        const url = `${this.oktaDomain}/api/v1/${endpoint}`

        const headers = {
            Authorization: `SSWS ${this.apiToken}`,
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
            throw new Error(`Okta API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        if (response.status === 204) {
            return 'Operation completed successfully' + TOOL_ARGS_PREFIX + JSON.stringify(params)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

// Okta Tools
class ListUsersTool extends BaseOktaTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_users',
            description: 'List users from Okta',
            schema: ListUsersSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            oktaDomain: args.oktaDomain,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `users?limit=${params.limit}`
            const response = await this.makeOktaRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing users: ${error}`, params)
        }
    }
}

class GetUserTool extends BaseOktaTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_user',
            description: 'Get a specific user from Okta',
            schema: GetUserSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            oktaDomain: args.oktaDomain,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `users/${params.userId}`
            const response = await this.makeOktaRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting user: ${error}`, params)
        }
    }
}

class CreateUserTool extends BaseOktaTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_user',
            description: 'Create a new user in Okta',
            schema: CreateUserSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            oktaDomain: args.oktaDomain,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const userData = {
                profile: {
                    firstName: params.firstName,
                    lastName: params.lastName,
                    email: params.email,
                    login: params.email
                },
                credentials: {
                    password: {
                        value: params.password
                    }
                }
            }

            const endpoint = 'users?activate=true'
            const response = await this.makeOktaRequest({ endpoint, method: 'POST', body: userData, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating user: ${error}`, params)
        }
    }
}

class ListGroupsTool extends BaseOktaTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_groups',
            description: 'List groups from Okta',
            schema: ListGroupsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            oktaDomain: args.oktaDomain,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `groups?limit=${params.limit}`
            const response = await this.makeOktaRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing groups: ${error}`, params)
        }
    }
}

class AddUserToGroupTool extends BaseOktaTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'add_user_to_group',
            description: 'Add a user to a group in Okta',
            schema: AddUserToGroupSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            oktaDomain: args.oktaDomain,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `groups/${params.groupId}/users/${params.userId}`
            const response = await this.makeOktaRequest({ endpoint, method: 'PUT', body: {}, params })
            return response || 'User added to group successfully'
        } catch (error) {
            return formatToolError(`Error adding user to group: ${error}`, params)
        }
    }
}

export const createOktaTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const oktaDomain = args?.oktaDomain || ''
    const apiToken = args?.apiToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_users')) {
        tools.push(
            new ListUsersTool({
                oktaDomain,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('get_user')) {
        tools.push(
            new GetUserTool({
                oktaDomain,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('create_user')) {
        tools.push(
            new CreateUserTool({
                oktaDomain,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('list_groups')) {
        tools.push(
            new ListGroupsTool({
                oktaDomain,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('add_user_to_group')) {
        tools.push(
            new AddUserToGroupTool({
                oktaDomain,
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
