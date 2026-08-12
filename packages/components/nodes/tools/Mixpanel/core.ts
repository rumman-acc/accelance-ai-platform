import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Mixpanel API for sending analytics events and setting user profiles`

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
    projectToken?: string
    defaultParams?: any
}

const MIXPANEL_BASE_URL = 'https://api.mixpanel.com'

// Define schemas for different Mixpanel operations
const TrackEventSchema = z.object({
    eventName: z.string().describe('Name of the event to track'),
    distinctId: z.string().describe('Unique identifier for the user triggering the event'),
    eventProperties: z.record(z.any()).optional().describe('Additional properties to attach to the event')
})

const SetUserProfileSchema = z.object({
    distinctId: z.string().describe('Unique identifier for the user'),
    userProperties: z.record(z.any()).describe('Properties to set on the user profile')
})

class BaseMixpanelTool extends DynamicStructuredTool {
    protected projectToken: string = ''

    constructor(args: any) {
        super(args)
        this.projectToken = args.projectToken ?? ''
    }

    async makeMixpanelRequest({
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
        const url = `${MIXPANEL_BASE_URL}/${endpoint}?ip=0`

        const headers = {
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
            throw new Error(`Mixpanel API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class TrackEventTool extends BaseMixpanelTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'track_event',
            description: 'Send an analytics event to Mixpanel',
            schema: TrackEventSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            projectToken: args.projectToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const eventData = [
                {
                    event: params.eventName,
                    properties: {
                        token: this.projectToken,
                        distinct_id: params.distinctId,
                        ...params.eventProperties
                    }
                }
            ]

            const response = await this.makeMixpanelRequest({ endpoint: 'track', method: 'POST', body: eventData, params })
            return response
        } catch (error) {
            return formatToolError(`Error tracking event: ${error}`, params)
        }
    }
}

class SetUserProfileTool extends BaseMixpanelTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'set_user_profile',
            description: 'Set properties on a user profile in Mixpanel',
            schema: SetUserProfileSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            projectToken: args.projectToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const profileData = [
                {
                    $token: this.projectToken,
                    $distinct_id: params.distinctId,
                    $set: params.userProperties
                }
            ]

            const response = await this.makeMixpanelRequest({ endpoint: 'engage', method: 'POST', body: profileData, params })
            return response
        } catch (error) {
            return formatToolError(`Error setting user profile: ${error}`, params)
        }
    }
}

export const createMixpanelTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const projectToken = args?.projectToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}

    if (actions.includes('track_event')) {
        tools.push(
            new TrackEventTool({
                projectToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    if (actions.includes('set_user_profile')) {
        tools.push(
            new SetUserProfileTool({
                projectToken,
                maxOutputLength,
                defaultParams
            })
        )
    }

    return tools
}
