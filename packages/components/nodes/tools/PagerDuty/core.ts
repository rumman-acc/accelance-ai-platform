import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access PagerDuty API for managing incidents and services`

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
    apiToken?: string
    defaultParams?: any
}

const PAGERDUTY_BASE_URL = 'https://api.pagerduty.com'

// Define schemas for different PagerDuty operations
const ListIncidentsSchema = z.object({
    limit: z.number().optional().default(25).describe('Maximum number of incidents to return')
})

const GetIncidentSchema = z.object({
    incidentId: z.string().describe('ID of the incident to retrieve')
})

const CreateIncidentSchema = z.object({
    title: z.string().describe('Title of the incident'),
    serviceId: z.string().describe('ID of the service the incident belongs to')
})

const UpdateIncidentSchema = z.object({
    incidentId: z.string().describe('ID of the incident to update'),
    status: z.string().describe('acknowledged or resolved')
})

const ListServicesSchema = z.object({
    limit: z.number().optional().default(25).describe('Maximum number of services to return')
})

class BasePagerDutyTool extends DynamicStructuredTool {
    protected apiToken: string = ''

    constructor(args: any) {
        super(args)
        this.apiToken = args.apiToken ?? ''
    }

    async makePagerDutyRequest({
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
        const url = `${PAGERDUTY_BASE_URL}${endpoint}`

        const headers = {
            Authorization: `Token token=${this.apiToken}`,
            Accept: 'application/vnd.pagerduty+json;version=2',
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
            throw new Error(`PagerDuty API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListIncidentsTool extends BasePagerDutyTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/incidents?limit=${params.limit}`
            const response = await this.makePagerDutyRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing incidents: ${error}`, params)
        }
    }
}

class GetIncidentTool extends BasePagerDutyTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/incidents/${params.incidentId}`
            const response = await this.makePagerDutyRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting incident: ${error}`, params)
        }
    }
}

class CreateIncidentTool extends BasePagerDutyTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
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
            return formatToolError(`Error creating incident: ${error}`, params)
        }
    }
}

class UpdateIncidentTool extends BasePagerDutyTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
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
            return formatToolError(`Error updating incident: ${error}`, params)
        }
    }
}

class ListServicesTool extends BasePagerDutyTool {
    defaultParams: any

    constructor(args: any) {
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

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/services?limit=${params.limit}`
            const response = await this.makePagerDutyRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error listing services: ${error}`, params)
        }
    }
}

export const createPagerDutyTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
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
