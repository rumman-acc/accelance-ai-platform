'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createSalesforceTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Salesforce API for querying and managing records such as Leads, Contacts, Accounts, Opportunities, or any custom object`
// Define schemas for different Salesforce operations
const QueryRecordsSchema = v3_1.z.object({
    soql: v3_1.z.string().describe('SOQL query, e.g. "SELECT Id, Name FROM Account LIMIT 10"')
})
const CreateRecordSchema = v3_1.z.object({
    sobjectType: v3_1.z.string().describe('e.g. Lead, Contact, Account, Opportunity, or a custom object API name'),
    fields: v3_1.z.record(v3_1.z.any()).describe('Field name/value pairs to set')
})
const GetRecordSchema = v3_1.z.object({
    sobjectType: v3_1.z.string().describe('e.g. Lead, Contact, Account, Opportunity, or a custom object API name'),
    recordId: v3_1.z.string().describe('The record ID')
})
const UpdateRecordSchema = v3_1.z.object({
    sobjectType: v3_1.z.string().describe('e.g. Lead, Contact, Account, Opportunity, or a custom object API name'),
    recordId: v3_1.z.string().describe('The record ID'),
    fields: v3_1.z.record(v3_1.z.any()).describe('Field name/value pairs to set')
})
const DeleteRecordSchema = v3_1.z.object({
    sobjectType: v3_1.z.string().describe('e.g. Lead, Contact, Account, Opportunity, or a custom object API name'),
    recordId: v3_1.z.string().describe('The record ID')
})
class BaseSalesforceTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.instanceUrl = ''
        this.accessToken = ''
        this.apiVersion = 'v62.0'
        this.instanceUrl = args.instanceUrl ?? ''
        this.accessToken = args.accessToken ?? ''
        this.apiVersion = args.apiVersion ?? 'v62.0'
    }
    async makeSalesforceRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${this.instanceUrl}/services/data/${this.apiVersion}/${endpoint}`
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
            throw new Error(`Salesforce API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        const data = await response.text()
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class QueryRecordsTool extends BaseSalesforceTool {
    constructor(args) {
        const toolInput = {
            name: 'query_records',
            description: 'Run a SOQL query against Salesforce and return the matching records',
            schema: QueryRecordsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            accessToken: args.accessToken,
            apiVersion: args.apiVersion,
            maxOutputLength: args.maxOutputLength
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const endpoint = `query/?q=${encodeURIComponent(params.soql)}`
            const response = await this.makeSalesforceRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error querying records: ${error}`, params)
        }
    }
}
class CreateRecordTool extends BaseSalesforceTool {
    constructor(args) {
        const toolInput = {
            name: 'create_record',
            description: 'Create a new Salesforce record for a given sObject type',
            schema: CreateRecordSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            accessToken: args.accessToken,
            apiVersion: args.apiVersion,
            maxOutputLength: args.maxOutputLength
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const endpoint = `sobjects/${params.sobjectType}`
            const response = await this.makeSalesforceRequest({ endpoint, method: 'POST', body: params.fields, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating record: ${error}`, params)
        }
    }
}
class GetRecordTool extends BaseSalesforceTool {
    constructor(args) {
        const toolInput = {
            name: 'get_record',
            description: 'Get a specific Salesforce record by sObject type and record ID',
            schema: GetRecordSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            accessToken: args.accessToken,
            apiVersion: args.apiVersion,
            maxOutputLength: args.maxOutputLength
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const endpoint = `sobjects/${params.sobjectType}/${params.recordId}`
            const response = await this.makeSalesforceRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting record: ${error}`, params)
        }
    }
}
class UpdateRecordTool extends BaseSalesforceTool {
    constructor(args) {
        const toolInput = {
            name: 'update_record',
            description: 'Update an existing Salesforce record by sObject type and record ID',
            schema: UpdateRecordSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            accessToken: args.accessToken,
            apiVersion: args.apiVersion,
            maxOutputLength: args.maxOutputLength
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const endpoint = `sobjects/${params.sobjectType}/${params.recordId}`
            const response = await this.makeSalesforceRequest({ endpoint, method: 'PATCH', body: params.fields, params })
            return response || 'Record updated successfully'
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error updating record: ${error}`, params)
        }
    }
}
class DeleteRecordTool extends BaseSalesforceTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_record',
            description: 'Delete a Salesforce record by sObject type and record ID',
            schema: DeleteRecordSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        }
        super({
            ...toolInput,
            instanceUrl: args.instanceUrl,
            accessToken: args.accessToken,
            apiVersion: args.apiVersion,
            maxOutputLength: args.maxOutputLength
        })
    }
    async _call(arg) {
        const params = { ...arg }
        try {
            const endpoint = `sobjects/${params.sobjectType}/${params.recordId}`
            const response = await this.makeSalesforceRequest({ endpoint, method: 'DELETE', params })
            return response || 'Record deleted successfully'
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting record: ${error}`, params)
        }
    }
}
const createSalesforceTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const instanceUrl = args?.instanceUrl || ''
    const accessToken = args?.accessToken || ''
    const apiVersion = args?.apiVersion || 'v62.0'
    const maxOutputLength = args?.maxOutputLength || Infinity
    if (actions.includes('query_records')) {
        tools.push(new QueryRecordsTool({ instanceUrl, accessToken, apiVersion, maxOutputLength }))
    }
    if (actions.includes('create_record')) {
        tools.push(new CreateRecordTool({ instanceUrl, accessToken, apiVersion, maxOutputLength }))
    }
    if (actions.includes('get_record')) {
        tools.push(new GetRecordTool({ instanceUrl, accessToken, apiVersion, maxOutputLength }))
    }
    if (actions.includes('update_record')) {
        tools.push(new UpdateRecordTool({ instanceUrl, accessToken, apiVersion, maxOutputLength }))
    }
    if (actions.includes('delete_record')) {
        tools.push(new DeleteRecordTool({ instanceUrl, accessToken, apiVersion, maxOutputLength }))
    }
    return tools
}
exports.createSalesforceTools = createSalesforceTools
//# sourceMappingURL=core.js.map
