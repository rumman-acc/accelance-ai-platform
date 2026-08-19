'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createEntraIdTools = exports.desc = void 0
exports.getEntraIdAccessToken = getEntraIdAccessToken
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Microsoft Entra ID (Azure AD) API for managing directory users and groups`
const ENTRAID_API_BASE_URL = 'https://graph.microsoft.com/v1.0'
// Fetches a fresh Azure AD app-only (client credentials) access token for Microsoft Graph.
// A new token is requested per tool invocation rather than cached/persisted.
async function getEntraIdAccessToken(tenantId, clientId, clientSecret) {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default'
    }).toString()
    const response = await (0, httpSecurity_1.secureFetch)(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    })
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Entra ID OAuth Error ${response.status}: ${response.statusText} - ${errorText}`)
    }
    const data = await response.json()
    return data.access_token
}
// Define schemas for different Entra ID operations
const ListUsersSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(25).describe('Maximum number of users to return')
})
const GetUserSchema = v3_1.z.object({
    userId: v3_1.z.string().describe('user ID or userPrincipalName')
})
const CreateUserSchema = v3_1.z.object({
    displayName: v3_1.z.string().describe('Display name of the user'),
    mailNickname: v3_1.z.string().describe('Mail nickname of the user'),
    userPrincipalName: v3_1.z.string().describe('User principal name (UPN), e.g. jane.doe@contoso.com'),
    initialPassword: v3_1.z.string().describe('Initial password to set for the user')
})
const ListGroupsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(25).describe('Maximum number of groups to return')
})
const AddUserToGroupSchema = v3_1.z.object({
    groupId: v3_1.z.string().describe('ID of the group'),
    userId: v3_1.z.string().describe('ID of the user to add to the group')
})
class BaseEntraIdTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.tenantId = ''
        this.clientId = ''
        this.clientSecret = ''
        this.tenantId = args.tenantId ?? ''
        this.clientId = args.clientId ?? ''
        this.clientSecret = args.clientSecret ?? ''
    }
    async makeEntraIdRequest({ endpoint, method = 'GET', body, params }) {
        const accessToken = await getEntraIdAccessToken(this.tenantId, this.clientId, this.clientSecret)
        const url = `${ENTRAID_API_BASE_URL}${endpoint}`
        const headers = {
            Authorization: `Bearer ${accessToken}`,
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
            throw new Error(`Entra ID API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        // Microsoft Graph returns HTTP 204 with no body for successful operations such as adding a group member
        if (response.status === 204) {
            return 'Operation completed successfully' + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListUsersTool extends BaseEntraIdTool {
    constructor(args) {
        const toolInput = {
            name: 'list_users',
            description: 'List users in the Entra ID (Azure AD) directory',
            schema: ListUsersSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/users?$top=${params.limit ?? 25}`
            const response = await this.makeEntraIdRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing users: ${error}`, params)
        }
    }
}
class GetUserTool extends BaseEntraIdTool {
    constructor(args) {
        const toolInput = {
            name: 'get_user',
            description: 'Get details of a specific user in the Entra ID (Azure AD) directory',
            schema: GetUserSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/users/${params.userId}`
            const response = await this.makeEntraIdRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting user: ${error}`, params)
        }
    }
}
class CreateUserTool extends BaseEntraIdTool {
    constructor(args) {
        const toolInput = {
            name: 'create_user',
            description: 'Create a new user in the Entra ID (Azure AD) directory',
            schema: CreateUserSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                accountEnabled: true,
                displayName: params.displayName,
                mailNickname: params.mailNickname,
                userPrincipalName: params.userPrincipalName,
                passwordProfile: {
                    password: params.initialPassword,
                    forceChangePasswordNextSignIn: true
                }
            }
            const response = await this.makeEntraIdRequest({ endpoint: '/users', method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating user: ${error}`, params)
        }
    }
}
class ListGroupsTool extends BaseEntraIdTool {
    constructor(args) {
        const toolInput = {
            name: 'list_groups',
            description: 'List groups in the Entra ID (Azure AD) directory',
            schema: ListGroupsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/groups?$top=${params.limit ?? 25}`
            const response = await this.makeEntraIdRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing groups: ${error}`, params)
        }
    }
}
class AddUserToGroupTool extends BaseEntraIdTool {
    constructor(args) {
        const toolInput = {
            name: 'add_user_to_group',
            description: 'Add a user to a group in the Entra ID (Azure AD) directory',
            schema: AddUserToGroupSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            tenantId: args.tenantId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${params.userId}`
            }
            const endpoint = `/groups/${params.groupId}/members/$ref`
            const response = await this.makeEntraIdRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error adding user to group: ${error}`, params)
        }
    }
}
const createEntraIdTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const tenantId = args?.tenantId || ''
    const clientId = args?.clientId || ''
    const clientSecret = args?.clientSecret || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('list_users')) {
        tools.push(new ListUsersTool({ tenantId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    if (actions.includes('get_user')) {
        tools.push(new GetUserTool({ tenantId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    if (actions.includes('create_user')) {
        tools.push(new CreateUserTool({ tenantId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    if (actions.includes('list_groups')) {
        tools.push(new ListGroupsTool({ tenantId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    if (actions.includes('add_user_to_group')) {
        tools.push(new AddUserToGroupTool({ tenantId, clientId, clientSecret, maxOutputLength, defaultParams }))
    }
    return tools
}
exports.createEntraIdTools = createEntraIdTools
//# sourceMappingURL=core.js.map
