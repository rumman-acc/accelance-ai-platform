import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to send analytics events to Segment`

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
    writeKey?: string
    defaultParams?: any
}

// Define schemas for different Segment operations

const TrackSchema = z.object({
    userId: z.string().describe('The user id to associate the event with'),
    event: z.string().describe('The name of the event being tracked'),
    properties: z.record(z.any()).optional().describe('A dictionary of properties for the event')
})

const IdentifySchema = z.object({
    userId: z.string().describe('The user id to identify'),
    traits: z.record(z.any()).optional().describe('A dictionary of traits for the user')
})

const PageSchema = z.object({
    userId: z.string().describe('The user id associated with the page view'),
    name: z.string().optional().describe('The name of the page'),
    properties: z.record(z.any()).optional().describe('A dictionary of properties for the page view')
})

const GroupSchema = z.object({
    userId: z.string().describe('The user id being added to a group'),
    groupId: z.string().describe('The group id'),
    traits: z.record(z.any()).optional().describe('A dictionary of traits for the group')
})

class BaseSegmentTool extends DynamicStructuredTool {
    protected writeKey: string = ''

    constructor(args: any) {
        super(args)
        this.writeKey = args.writeKey ?? ''
    }

    async makeSegmentRequest({
        endpoint,
        method = 'POST',
        body,
        params
    }: {
        endpoint: string
        method?: string
        body?: any
        params?: any
    }): Promise<string> {
        const url = `https://api.segment.io/v1/${endpoint}`

        const authHeader = `Basic ${Buffer.from(`${this.writeKey}:`).toString('base64')}`

        const headers = {
            Authorization: authHeader,
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
            throw new Error(`Segment API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        // Segment's track/identify/page/group endpoints return an empty 200 body on success
        const data = await response.text()
        const result = data && data.trim().length > 0 ? data : 'Event successfully sent to Segment'
        return result + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class TrackTool extends BaseSegmentTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'segment_track',
            description: 'Track an event performed by a user in Segment',
            schema: TrackSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            writeKey: args.writeKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                userId: params.userId,
                event: params.event,
                properties: params.properties
            }
            const response = await this.makeSegmentRequest({ endpoint: 'track', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error tracking event: ${error}`, params)
        }
    }
}

class IdentifyTool extends BaseSegmentTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'segment_identify',
            description: 'Identify a user and their traits in Segment',
            schema: IdentifySchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            writeKey: args.writeKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                userId: params.userId,
                traits: params.traits
            }
            const response = await this.makeSegmentRequest({ endpoint: 'identify', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error identifying user: ${error}`, params)
        }
    }
}

class PageTool extends BaseSegmentTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'segment_page',
            description: 'Record a page view event in Segment',
            schema: PageSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            writeKey: args.writeKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                userId: params.userId,
                name: params.name,
                properties: params.properties
            }
            const response = await this.makeSegmentRequest({ endpoint: 'page', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error recording page view: ${error}`, params)
        }
    }
}

class GroupTool extends BaseSegmentTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'segment_group',
            description: 'Associate a user with a group in Segment',
            schema: GroupSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            writeKey: args.writeKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                userId: params.userId,
                groupId: params.groupId,
                traits: params.traits
            }
            const response = await this.makeSegmentRequest({ endpoint: 'group', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error grouping user: ${error}`, params)
        }
    }
}

export const createSegmentTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const writeKey = args?.writeKey || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('track')) {
        tools.push(
            new TrackTool({
                writeKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('identify')) {
        tools.push(
            new IdentifyTool({
                writeKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('page')) {
        tools.push(
            new PageTool({
                writeKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('group')) {
        tools.push(
            new GroupTool({
                writeKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
