'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createSendGridTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access SendGrid API for sending email and managing marketing contacts`
const SENDGRID_BASE_URL = 'https://api.sendgrid.com/v3'
// Define schemas for different SendGrid operations
const SendEmailSchema = v3_1.z.object({
    toEmail: v3_1.z.string().describe('Recipient email address'),
    fromEmail: v3_1.z.string().describe('Sender email address'),
    subject: v3_1.z.string().describe('Email subject'),
    body: v3_1.z.string().describe('Email body content')
})
const ListContactsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of contacts to return')
})
const AddContactSchema = v3_1.z.object({
    email: v3_1.z.string().describe('Contact email address'),
    firstName: v3_1.z.string().optional().describe('Contact first name'),
    lastName: v3_1.z.string().optional().describe('Contact last name')
})
const ListTemplatesSchema = v3_1.z.object({})
const GetStatsSchema = v3_1.z.object({
    startDate: v3_1.z.string().describe('YYYY-MM-DD')
})
class BaseSendGridTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.apiKey = ''
        this.apiKey = args.apiKey ?? ''
    }
    async makeSendGridRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${SENDGRID_BASE_URL}/${endpoint}`
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
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
            throw new Error(`SendGrid API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class SendEmailTool extends BaseSendGridTool {
    constructor(args) {
        const toolInput = {
            name: 'send_email',
            description: 'Send an email via SendGrid',
            schema: SendEmailSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const emailData = {
                personalizations: [{ to: [{ email: params.toEmail }] }],
                from: { email: params.fromEmail },
                subject: params.subject,
                content: [{ type: 'text/plain', value: params.body }]
            }
            // SendGrid returns HTTP 202 with an empty body on success
            await this.makeSendGridRequest({ endpoint: 'mail/send', method: 'POST', body: emailData, params })
            return 'Email sent successfully' + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error sending email: ${error}`, params)
        }
    }
}
class ListContactsTool extends BaseSendGridTool {
    constructor(args) {
        const toolInput = {
            name: 'list_contacts',
            description: 'List marketing contacts from SendGrid',
            schema: ListContactsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `marketing/contacts?page_size=${params.limit}`
            const response = await this.makeSendGridRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing contacts: ${error}`, params)
        }
    }
}
class AddContactTool extends BaseSendGridTool {
    constructor(args) {
        const toolInput = {
            name: 'add_contact',
            description: 'Add or update a marketing contact in SendGrid',
            schema: AddContactSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const contactData = {
                email: params.email
            }
            if (params.firstName) contactData.first_name = params.firstName
            if (params.lastName) contactData.last_name = params.lastName
            const body = { contacts: [contactData] }
            const response = await this.makeSendGridRequest({ endpoint: 'marketing/contacts', method: 'PUT', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error adding contact: ${error}`, params)
        }
    }
}
class ListTemplatesTool extends BaseSendGridTool {
    constructor(args) {
        const toolInput = {
            name: 'list_templates',
            description: 'List dynamic email templates from SendGrid',
            schema: ListTemplatesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `templates?generations=dynamic`
            const response = await this.makeSendGridRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing templates: ${error}`, params)
        }
    }
}
class GetStatsTool extends BaseSendGridTool {
    constructor(args) {
        const toolInput = {
            name: 'get_stats',
            description: 'Get global email statistics from SendGrid',
            schema: GetStatsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `stats?start_date=${params.startDate}`
            const response = await this.makeSendGridRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting stats: ${error}`, params)
        }
    }
}
const createSendGridTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const apiKey = args?.apiKey || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('send_email')) {
        tools.push(
            new SendEmailTool({
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_contacts')) {
        tools.push(
            new ListContactsTool({
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('add_contact')) {
        tools.push(
            new AddContactTool({
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_templates')) {
        tools.push(
            new ListTemplatesTool({
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('get_stats')) {
        tools.push(
            new GetStatsTool({
                apiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    return tools
}
exports.createSendGridTools = createSendGridTools
//# sourceMappingURL=core.js.map
