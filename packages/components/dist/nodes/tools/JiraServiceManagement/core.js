'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createJiraServiceManagementTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Jira Service Management API for managing customer requests and service desks`
// Define schemas for different Jira Service Management operations
const ListServiceDesksSchema = v3_1.z.object({})
const CreateCustomerRequestSchema = v3_1.z.object({
    serviceDeskId: v3_1.z.string().describe('ID of the service desk to create the request in'),
    requestTypeId: v3_1.z.string().describe('ID of the request type for the customer request'),
    summary: v3_1.z.string().describe('Summary of the customer request'),
    description: v3_1.z.string().optional().describe('Description of the customer request')
})
const GetRequestSchema = v3_1.z.object({
    issueIdOrKey: v3_1.z.string().describe('Issue ID or key of the customer request (e.g., PROJ-123)')
})
const ListRequestsSchema = v3_1.z.object({
    serviceDeskId: v3_1.z.string().optional().describe('ID of the service desk to filter requests by')
})
const AddCommentSchema = v3_1.z.object({
    issueIdOrKey: v3_1.z.string().describe('Issue ID or key of the customer request (e.g., PROJ-123)'),
    commentBody: v3_1.z.string().describe('Text content of the comment to add')
})
class BaseJiraServiceManagementTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.username = ''
        this.accessToken = ''
        this.siteUrl = ''
        this.username = args.username ?? ''
        this.accessToken = args.accessToken ?? ''
        this.siteUrl = args.siteUrl ?? ''
    }
    async makeJiraServiceManagementRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${this.siteUrl}/rest/servicedeskapi/${endpoint}`
        const auth = Buffer.from(`${this.username}:${this.accessToken}`).toString('base64')
        const headers = {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Jira Service Management API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListServiceDesksTool extends BaseJiraServiceManagementTool {
    constructor(args) {
        const toolInput = {
            name: 'list_service_desks',
            description: 'List service desks in Jira Service Management',
            schema: ListServiceDesksSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const response = await this.makeJiraServiceManagementRequest({ endpoint: 'servicedesk', params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing service desks: ${error}`, params)
        }
    }
}
class CreateCustomerRequestTool extends BaseJiraServiceManagementTool {
    constructor(args) {
        const toolInput = {
            name: 'create_customer_request',
            description: 'Create a new customer request in Jira Service Management',
            schema: CreateCustomerRequestSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const requestData = {
                serviceDeskId: params.serviceDeskId,
                requestTypeId: params.requestTypeId,
                requestFieldValues: {
                    summary: params.summary,
                    description: params.description
                }
            }
            const response = await this.makeJiraServiceManagementRequest({ endpoint: 'request', method: 'POST', body: requestData, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating customer request: ${error}`, params)
        }
    }
}
class GetRequestTool extends BaseJiraServiceManagementTool {
    constructor(args) {
        const toolInput = {
            name: 'get_request',
            description: 'Get a specific customer request from Jira Service Management',
            schema: GetRequestSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `request/${params.issueIdOrKey}`
            const response = await this.makeJiraServiceManagementRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting request: ${error}`, params)
        }
    }
}
class ListRequestsTool extends BaseJiraServiceManagementTool {
    constructor(args) {
        const toolInput = {
            name: 'list_requests',
            description: 'List customer requests in Jira Service Management',
            schema: ListRequestsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        const queryParams = new URLSearchParams()
        if (params.serviceDeskId) queryParams.append('serviceDeskId', params.serviceDeskId)
        const queryString = queryParams.toString()
        const endpoint = queryString ? `request?${queryString}` : 'request'
        try {
            const response = await this.makeJiraServiceManagementRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing requests: ${error}`, params)
        }
    }
}
class AddCommentTool extends BaseJiraServiceManagementTool {
    constructor(args) {
        const toolInput = {
            name: 'add_comment',
            description: 'Add a comment to a customer request in Jira Service Management',
            schema: AddCommentSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            username: args.username,
            accessToken: args.accessToken,
            siteUrl: args.siteUrl,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const commentData = {
                body: params.commentBody,
                public: true
            }
            const endpoint = `request/${params.issueIdOrKey}/comment`
            const response = await this.makeJiraServiceManagementRequest({ endpoint, method: 'POST', body: commentData, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error adding comment: ${error}`, params)
        }
    }
}
const createJiraServiceManagementTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const username = args?.username || ''
    const accessToken = args?.accessToken || ''
    const siteUrl = args?.siteUrl || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('list_service_desks')) {
        tools.push(
            new ListServiceDesksTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('create_customer_request')) {
        tools.push(
            new CreateCustomerRequestTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('get_request')) {
        tools.push(
            new GetRequestTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_requests')) {
        tools.push(
            new ListRequestsTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('add_comment')) {
        tools.push(
            new AddCommentTool({
                username,
                accessToken,
                siteUrl,
                maxOutputLength,
                defaultParams
            })
        )
    }
    return tools
}
exports.createJiraServiceManagementTools = createJiraServiceManagementTools
//# sourceMappingURL=core.js.map
