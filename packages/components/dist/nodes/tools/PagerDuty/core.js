'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createPagerDutyTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access PagerDuty API for managing incidents and services`
const PAGERDUTY_BASE_URL = 'https://api.pagerduty.com'
// Define schemas for different PagerDuty operations
const ListIncidentsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(25).describe('Maximum number of incidents to return')
})
const GetIncidentSchema = v3_1.z.object({
    incidentId: v3_1.z.string().describe('ID of the incident to retrieve')
})
const CreateIncidentSchema = v3_1.z.object({
    title: v3_1.z.string().describe('Title of the incident'),
    serviceId: v3_1.z.string().describe('ID of the service the incident belongs to')
})
const UpdateIncidentSchema = v3_1.z.object({
    incidentId: v3_1.z.string().describe('ID of the incident to update'),
    status: v3_1.z.string().describe('acknowledged or resolved')
})
const ListServicesSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(25).describe('Maximum number of services to return')
})
class BasePagerDutyTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.apiToken = ''
        this.apiToken = args.apiToken ?? ''
    }
    async makePagerDutyRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${PAGERDUTY_BASE_URL}${endpoint}`
        const headers = {
            Authorization: `Token token=${this.apiToken}`,
            Accept: 'application/vnd.pagerduty+json;version=2',
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
            throw new Error(`PagerDuty API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListIncidentsTool extends BasePagerDutyTool {
    constructor(args) {
        const toolInput = {
            name: 'list_incidents',
            description: 'List incidents from PagerDuty',
            schema: ListIncidentsSchema,
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/incidents?limit=${params.limit}`
            const response = await this.makePagerDutyRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing incidents: ${error}`, params)
        }
    }
}
class GetIncidentTool extends BasePagerDutyTool {
    constructor(args) {
        const toolInput = {
            name: 'get_incident',
            description: 'Get a specific incident from PagerDuty',
            schema: GetIncidentSchema,
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/incidents/${params.incidentId}`
            const response = await this.makePagerDutyRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting incident: ${error}`, params)
        }
    }
}
class CreateIncidentTool extends BasePagerDutyTool {
    constructor(args) {
        const toolInput = {
            name: 'create_incident',
            description: 'Create a new incident in PagerDuty',
            schema: CreateIncidentSchema,
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const incidentData = {
                incident: {
                    type: 'incident',
                    title: params.title,
                    service: {
                        id: params.serviceId,
                        type: 'service_reference'
                    }
                }
            }
            const endpoint = '/incidents'
            const response = await this.makePagerDutyRequest({ endpoint, method: 'POST', body: incidentData, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating incident: ${error}`, params)
        }
    }
}
class UpdateIncidentTool extends BasePagerDutyTool {
    constructor(args) {
        const toolInput = {
            name: 'update_incident',
            description: 'Update an existing incident in PagerDuty',
            schema: UpdateIncidentSchema,
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const incidentData = {
                incident: {
                    type: 'incident',
                    status: params.status
                }
            }
            const endpoint = `/incidents/${params.incidentId}`
            const response = await this.makePagerDutyRequest({ endpoint, method: 'PUT', body: incidentData, params })
            return response || 'Incident updated successfully'
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error updating incident: ${error}`, params)
        }
    }
}
class ListServicesTool extends BasePagerDutyTool {
    constructor(args) {
        const toolInput = {
            name: 'list_services',
            description: 'List services from PagerDuty',
            schema: ListServicesSchema,
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
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/services?limit=${params.limit}`
            const response = await this.makePagerDutyRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing services: ${error}`, params)
        }
    }
}
const createPagerDutyTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const apiToken = args?.apiToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('list_incidents')) {
        tools.push(
            new ListIncidentsTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('get_incident')) {
        tools.push(
            new GetIncidentTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('create_incident')) {
        tools.push(
            new CreateIncidentTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('update_incident')) {
        tools.push(
            new UpdateIncidentTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_services')) {
        tools.push(
            new ListServicesTool({
                apiToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    return tools
}
exports.createPagerDutyTools = createPagerDutyTools
//# sourceMappingURL=core.js.map
