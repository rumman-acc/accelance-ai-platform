'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createAmplitudeTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to send analytics events to Amplitude`
const AMPLITUDE_BASE_URL = 'https://api2.amplitude.com'
// Define schemas for different Amplitude operations
const TrackEventSchema = v3_1.z.object({
    userId: v3_1.z.string().describe('The user ID to associate the event with'),
    eventType: v3_1.z.string().describe('The name/type of the event to track'),
    eventProperties: v3_1.z.record(v3_1.z.any()).optional().describe('Additional properties to attach to the event')
})
const IdentifyUserSchema = v3_1.z.object({
    userId: v3_1.z.string().describe('The user ID to identify'),
    userProperties: v3_1.z.record(v3_1.z.any()).optional().describe('Properties to set on the user')
})
const BatchTrackEventsSchema = v3_1.z.object({
    events: v3_1.z
        .array(
            v3_1.z.object({
                user_id: v3_1.z.string(),
                event_type: v3_1.z.string(),
                event_properties: v3_1.z.record(v3_1.z.any()).optional()
            })
        )
        .describe('Array of Amplitude event objects')
})
class BaseAmplitudeTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.apiKey = ''
        this.secretKey = ''
        this.apiKey = args.apiKey ?? ''
        this.secretKey = args.secretKey ?? ''
    }
    async makeAmplitudeRequest({ endpoint, method = 'POST', body, headers, params }) {
        const url = `${AMPLITUDE_BASE_URL}${endpoint}`
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.headers,
                ...headers
            },
            body
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Amplitude API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class TrackEventTool extends BaseAmplitudeTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error tracking event: ${error}`, params)
        }
    }
}
class IdentifyUserTool extends BaseAmplitudeTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error identifying user: ${error}`, params)
        }
    }
}
class BatchTrackEventsTool extends BaseAmplitudeTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error batch tracking events: ${error}`, params)
        }
    }
}
const createAmplitudeTools = (args) => {
    const tools = []
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
exports.createAmplitudeTools = createAmplitudeTools
//# sourceMappingURL=core.js.map
