import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Zoom API for managing meetings and users`

const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2'
const ZOOM_OAUTH_TOKEN_URL = 'https://zoom.us/oauth/token'

export interface RequestParameters {
    name?: string
    actions?: string[]
    accountId?: string
    clientId?: string
    clientSecret?: string
    defaultParams?: any
    maxOutputLength?: number
}

// Fetches a fresh Server-to-Server OAuth access token from Zoom.
// A new token is requested per tool invocation rather than cached/persisted.
export async function getZoomAccessToken(accountId: string, clientId: string, clientSecret: string): Promise<string> {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const body = new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: accountId
    }).toString()

    const response = await secureFetch(ZOOM_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Zoom OAuth Error ${response.status}: ${response.statusText} - ${errorText}`)
    }

    const data: any = await response.json()
    return data.access_token
}

// Define schemas for different Zoom operations
const ListMeetingsSchema = z.object({
    limit: z.number().optional().default(30).describe('Maximum number of meetings to return')
})

const CreateMeetingSchema = z.object({
    topic: z.string().describe('Meeting topic'),
    startTime: z.string().describe('ISO 8601, e.g. 2026-09-01T15:00:00Z'),
    duration: z.number().describe('minutes')
})

const GetMeetingSchema = z.object({
    meetingId: z.string().describe('ID of the meeting')
})

const DeleteMeetingSchema = z.object({
    meetingId: z.string().describe('ID of the meeting to delete')
})

const ListUsersSchema = z.object({
    limit: z.number().optional().default(30).describe('Maximum number of users to return')
})

class BaseZoomTool extends DynamicStructuredTool {
    protected accountId: string = ''
    protected clientId: string = ''
    protected clientSecret: string = ''

    constructor(args: any) {
        super(args)
        this.accountId = args.accountId ?? ''
        this.clientId = args.clientId ?? ''
        this.clientSecret = args.clientSecret ?? ''
    }

    async makeZoomRequest({
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
        const accessToken = await getZoomAccessToken(this.accountId, this.clientId, this.clientSecret)

        const url = `${ZOOM_API_BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Bearer ${accessToken}`,
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
            throw new Error(`Zoom API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        // Zoom returns HTTP 204 with no body for successful deletes
        if (response.status === 204) {
            return 'Operation completed successfully' + TOOL_ARGS_PREFIX + JSON.stringify(params)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListMeetingsTool extends BaseZoomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_meetings',
            description: 'List scheduled Zoom meetings for the current user',
            schema: ListMeetingsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/users/me/meetings?page_size=${params.limit ?? 30}`
            const response = await this.makeZoomRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing meetings: ${error}`, params)
        }
    }
}

class CreateMeetingTool extends BaseZoomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_meeting',
            description: 'Create a new Zoom meeting',
            schema: CreateMeetingSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                topic: params.topic,
                type: 2,
                start_time: params.startTime,
                duration: params.duration
            }

            const response = await this.makeZoomRequest({ endpoint: '/users/me/meetings', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating meeting: ${error}`, params)
        }
    }
}

class GetMeetingTool extends BaseZoomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_meeting',
            description: 'Get details of a specific Zoom meeting',
            schema: GetMeetingSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/meetings/${params.meetingId}`
            const response = await this.makeZoomRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting meeting: ${error}`, params)
        }
    }
}

class DeleteMeetingTool extends BaseZoomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'delete_meeting',
            description: 'Delete a Zoom meeting',
            schema: DeleteMeetingSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        }
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/meetings/${params.meetingId}`
            const response = await this.makeZoomRequest({ endpoint, method: 'DELETE', params })
            return response
        } catch (error) {
            return formatToolError(`Error deleting meeting: ${error}`, params)
        }
    }
}

class ListUsersTool extends BaseZoomTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_users',
            description: 'List users on the Zoom account',
            schema: ListUsersSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/users?page_size=${params.limit ?? 30}`
            const response = await this.makeZoomRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing users: ${error}`, params)
        }
    }
}

export const createZoomTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const accountId = args?.accountId || ''
    const clientId = args?.clientId || ''
    const clientSecret = args?.clientSecret || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('list_meetings')) {
        tools.push(new ListMeetingsTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }

    if (actions.includes('create_meeting')) {
        tools.push(new CreateMeetingTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }

    if (actions.includes('get_meeting')) {
        tools.push(new GetMeetingTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }

    if (actions.includes('delete_meeting')) {
        tools.push(new DeleteMeetingTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }

    if (actions.includes('list_users')) {
        tools.push(new ListUsersTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }

    return tools
}
