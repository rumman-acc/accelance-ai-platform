'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createIntercomTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Intercom API for managing contacts and conversations`
const BASE_URL = 'https://api.intercom.io'
// Define schemas for different Intercom operations
const ListContactsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of contacts to return')
})
const CreateContactSchema = v3_1.z.object({
    email: v3_1.z.string().describe('Email address of the contact'),
    name: v3_1.z.string().optional().describe('Name of the contact')
})
const GetContactSchema = v3_1.z.object({
    contactId: v3_1.z.string().describe('ID of the contact to retrieve')
})
const CreateConversationSchema = v3_1.z.object({
    contactId: v3_1.z.string().describe('ID of the contact to start the conversation from'),
    messageBody: v3_1.z.string().describe('Body of the message to send')
})
const ListConversationsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of conversations to return')
})
class BaseIntercomTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.accessToken = ''
        this.accessToken = args.accessToken ?? ''
    }
    async makeIntercomRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${BASE_URL}${endpoint}`
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Intercom-Version': '2.11',
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
            throw new Error(`Intercom API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListContactsTool extends BaseIntercomTool {
    constructor(args) {
        const toolInput = {
            name: 'list_contacts',
            description: 'List contacts from Intercom',
            schema: ListContactsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/contacts?per_page=${params.limit}`
            const response = await this.makeIntercomRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing contacts: ${error}`, params)
        }
    }
}
class CreateContactTool extends BaseIntercomTool {
    constructor(args) {
        const toolInput = {
            name: 'create_contact',
            description: 'Create a new contact in Intercom',
            schema: CreateContactSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                email: params.email,
                name: params.name,
                role: 'user'
            }
            const response = await this.makeIntercomRequest({ endpoint: '/contacts', method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating contact: ${error}`, params)
        }
    }
}
class GetContactTool extends BaseIntercomTool {
    constructor(args) {
        const toolInput = {
            name: 'get_contact',
            description: 'Get a specific contact from Intercom',
            schema: GetContactSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/contacts/${params.contactId}`
            const response = await this.makeIntercomRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting contact: ${error}`, params)
        }
    }
}
class CreateConversationTool extends BaseIntercomTool {
    constructor(args) {
        const toolInput = {
            name: 'create_conversation',
            description: 'Create a new conversation in Intercom',
            schema: CreateConversationSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                from: {
                    type: 'user',
                    id: params.contactId
                },
                body: params.messageBody
            }
            const response = await this.makeIntercomRequest({ endpoint: '/conversations', method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating conversation: ${error}`, params)
        }
    }
}
class ListConversationsTool extends BaseIntercomTool {
    constructor(args) {
        const toolInput = {
            name: 'list_conversations',
            description: 'List conversations from Intercom',
            schema: ListConversationsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/conversations?per_page=${params.limit}`
            const response = await this.makeIntercomRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing conversations: ${error}`, params)
        }
    }
}
const createIntercomTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const accessToken = args?.accessToken || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('list_contacts')) {
        tools.push(
            new ListContactsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('create_contact')) {
        tools.push(
            new CreateContactTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('get_contact')) {
        tools.push(
            new GetContactTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('create_conversation')) {
        tools.push(
            new CreateConversationTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_conversations')) {
        tools.push(
            new ListConversationsTool({
                accessToken,
                maxOutputLength,
                defaultParams
            })
        )
    }
    return tools
}
exports.createIntercomTools = createIntercomTools
//# sourceMappingURL=core.js.map
