import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to send analytics events to Amplitude`

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
    apiKey?: string
    secretKey?: string
    defaultParams?: any
}

const AMPLITUDE_BASE_URL = 'https://api2.amplitude.com'

// Define schemas for different Amplitude operations

const TrackEventSchema = z.object({
    userId: z.string().describe('The user ID to associate the event with'),
    eventType: z.string().describe('The name/type of the event to track'),
    eventProperties: z.record(z.any()).optional().describe('Additional properties to attach to the event')
})

const IdentifyUserSchema = z.object({
    userId: z.string().describe('The user ID to identify'),
    userProperties: z.record(z.any()).optional().describe('Properties to set on the user')
})

const BatchTrackEventsSchema = z.object({
    events: z
        .array(
            z.object({
                user_id: z.string(),
                event_type: z.string(),
                event_properties: z.record(z.any()).optional()
            })
        )
        .describe('Array of Amplitude event objects')
})

class BaseAmplitudeTool extends DynamicStructuredTool {
    protected apiKey: string = ''
    protected secretKey: string = ''

    constructor(args: any) {
        super(args)
        this.apiKey = args.apiKey ?? ''
        this.secretKey = args.secretKey ?? ''
    }

    async makeAmplitudeRequest({
        endpoint,
        method = 'POST',
        body,
        headers,
        params
    }: {
        endpoint: string
        method?: string
        body?: any
        headers?: Headers
        params?: any
    }): Promise<string> {
        const url = `${AMPLITUDE_BASE_URL}${endpoint}`

        const fetchOptions: any = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.headers,
                ...headers
            },
            body
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Amplitude API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class TrackEventTool extends BaseAmplitudeTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'track_event',
            description: 'Send a single analytics event to Amplitude',
            schema: TrackEventSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            secretKey: args.secretKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                api_key: this.apiKey,
                events: [
                    {
                        user_id: params.userId,
                        event_type: params.eventType,
                        event_properties: params.eventProperties
                    }
                ]
            }

            const response = await this.makeAmplitudeRequest({
                endpoint: '/2/httpapi',
                method: 'POST',
                body: JSON.stringify(body),
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error tracking event: ${error}`, params)
        }
    }
}

class IdentifyUserTool extends BaseAmplitudeTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'identify_user',
            description: 'Identify a user and set their properties in Amplitude',
            schema: IdentifyUserSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            secretKey: args.secretKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = new URLSearchParams({
                api_key: this.apiKey,
                identification: JSON.stringify([
                    {
                        user_id: params.userId,
                        user_properties: params.userProperties
                    }
                ])
            })

            const response = await this.makeAmplitudeRequest({
                endpoint: '/identify',
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error identifying user: ${error}`, params)
        }
    }
}

class BatchTrackEventsTool extends BaseAmplitudeTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'batch_track_events',
            description: 'Send a batch of analytics events to Amplitude',
            schema: BatchTrackEventsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            secretKey: args.secretKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                api_key: this.apiKey,
                events: params.events
            }

            const response = await this.makeAmplitudeRequest({
                endpoint: '/batch',
                method: 'POST',
                body: JSON.stringify(body),
                params
            })
            return response
        } catch (error) {
            return formatToolError(`Error batch tracking events: ${error}`, params)
        }
    }
}

export const createAmplitudeTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const apiKey = args?.apiKey || ''
    const secretKey = args?.secretKey || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('track_event')) {
        tools.push(
            new TrackEventTool({
                apiKey,
                secretKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('identify_user')) {
        tools.push(
            new IdentifyUserTool({
                apiKey,
                secretKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('batch_track_events')) {
        tools.push(
            new BatchTrackEventsTool({
                apiKey,
                secretKey,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
