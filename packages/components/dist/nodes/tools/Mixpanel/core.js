'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createMixpanelTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Mixpanel API for sending analytics events and setting user profiles`
const MIXPANEL_BASE_URL = 'https://api.mixpanel.com'
// Define schemas for different Mixpanel operations
const TrackEventSchema = v3_1.z.object({
    eventName: v3_1.z.string().describe('Name of the event to track'),
    distinctId: v3_1.z.string().describe('Unique identifier for the user triggering the event'),
    eventProperties: v3_1.z.record(v3_1.z.any()).optional().describe('Additional properties to attach to the event')
})
const SetUserProfileSchema = v3_1.z.object({
    distinctId: v3_1.z.string().describe('Unique identifier for the user'),
    userProperties: v3_1.z.record(v3_1.z.any()).describe('Properties to set on the user profile')
})
class BaseMixpanelTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.projectToken = ''
        this.projectToken = args.projectToken ?? ''
    }
    async makeMixpanelRequest({ endpoint, method = 'POST', body, params }) {
        const url = `${MIXPANEL_BASE_URL}/${endpoint}?ip=0`
        const headers = {
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
            throw new Error(`Mixpanel API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class TrackEventTool extends BaseMixpanelTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error tracking event: ${error}`, params)
        }
    }
}
class SetUserProfileTool extends BaseMixpanelTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error setting user profile: ${error}`, params)
        }
    }
}
const createMixpanelTools = (args) => {
    const tools = []
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
exports.createMixpanelTools = createMixpanelTools
//# sourceMappingURL=core.js.map
