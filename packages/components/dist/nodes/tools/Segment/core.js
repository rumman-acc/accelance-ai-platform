'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createSegmentTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to send analytics events to Segment`
// Define schemas for different Segment operations
const TrackSchema = v3_1.z.object({
    userId: v3_1.z.string().describe('The user id to associate the event with'),
    event: v3_1.z.string().describe('The name of the event being tracked'),
    properties: v3_1.z.record(v3_1.z.any()).optional().describe('A dictionary of properties for the event')
})
const IdentifySchema = v3_1.z.object({
    userId: v3_1.z.string().describe('The user id to identify'),
    traits: v3_1.z.record(v3_1.z.any()).optional().describe('A dictionary of traits for the user')
})
const PageSchema = v3_1.z.object({
    userId: v3_1.z.string().describe('The user id associated with the page view'),
    name: v3_1.z.string().optional().describe('The name of the page'),
    properties: v3_1.z.record(v3_1.z.any()).optional().describe('A dictionary of properties for the page view')
})
const GroupSchema = v3_1.z.object({
    userId: v3_1.z.string().describe('The user id being added to a group'),
    groupId: v3_1.z.string().describe('The group id'),
    traits: v3_1.z.record(v3_1.z.any()).optional().describe('A dictionary of traits for the group')
})
class BaseSegmentTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.writeKey = ''
        this.writeKey = args.writeKey ?? ''
    }
    async makeSegmentRequest({ endpoint, method = 'POST', body, params }) {
        const url = `https://api.segment.io/v1/${endpoint}`
        const authHeader = `Basic ${Buffer.from(`${this.writeKey}:`).toString('base64')}`
        const headers = {
            Authorization: authHeader,
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
            throw new Error(`Segment API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        // Segment's track/identify/page/group endpoints return an empty 200 body on success
        const data = await response.text()
        const result = data && data.trim().length > 0 ? data : 'Event successfully sent to Segment'
        return result + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class TrackTool extends BaseSegmentTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error tracking event: ${error}`, params)
        }
    }
}
class IdentifyTool extends BaseSegmentTool {
    constructor(args) {
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                userId: params.userId,
                traits: params.traits
            }
            const response = await this.makeSegmentRequest({ endpoint: 'identify', method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error identifying user: ${error}`, params)
        }
    }
}
class PageTool extends BaseSegmentTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error recording page view: ${error}`, params)
        }
    }
}
class GroupTool extends BaseSegmentTool {
    constructor(args) {
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
    async _call(arg) {
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
            return (0, agents_1.formatToolError)(`Error grouping user: ${error}`, params)
        }
    }
}
const createSegmentTools = (args) => {
    const tools = []
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
exports.createSegmentTools = createSegmentTools
//# sourceMappingURL=core.js.map
