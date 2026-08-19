"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHubspotTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access HubSpot API for managing CRM contacts and deals`;
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
// Define schemas for different HubSpot operations
const ListContactsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(10).describe('Maximum number of contacts to return'),
    after: v3_1.z.string().optional().describe('Pagination cursor from a previous response')
});
const CreateContactSchema = v3_1.z.object({
    properties: v3_1.z.record(v3_1.z.string()).describe('Contact property name/value pairs, e.g. { email, firstname, lastname }')
});
const GetContactSchema = v3_1.z.object({
    contactId: v3_1.z.string().describe('The ID of the contact to retrieve')
});
const UpdateContactSchema = v3_1.z.object({
    contactId: v3_1.z.string().describe('The ID of the contact to update'),
    properties: v3_1.z.record(v3_1.z.string()).describe('Contact property name/value pairs to update')
});
const ListDealsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(10).describe('Maximum number of deals to return'),
    after: v3_1.z.string().optional().describe('Pagination cursor from a previous response')
});
const CreateDealSchema = v3_1.z.object({
    properties: v3_1.z.record(v3_1.z.string()).describe('Deal property name/value pairs, e.g. { dealname, amount, dealstage }')
});
class BaseHubspotTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.privateAppToken = '';
        this.privateAppToken = args.privateAppToken ?? '';
    }
    async makeHubspotRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${HUBSPOT_BASE_URL}${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.privateAppToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HubSpot API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
// Contact Tools
class ListContactsTool extends BaseHubspotTool {
    constructor(args) {
        const toolInput = {
            name: 'list_contacts',
            description: 'List contacts from HubSpot CRM',
            schema: ListContactsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            privateAppToken: args.privateAppToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const queryParams = new URLSearchParams();
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.after)
                queryParams.append('after', params.after);
            const endpoint = `/crm/v3/objects/contacts?${queryParams.toString()}`;
            const response = await this.makeHubspotRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing contacts: ${error}`, params);
        }
    }
}
class CreateContactTool extends BaseHubspotTool {
    constructor(args) {
        const toolInput = {
            name: 'create_contact',
            description: 'Create a new contact in HubSpot CRM',
            schema: CreateContactSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            privateAppToken: args.privateAppToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const body = { properties: params.properties };
            const endpoint = `/crm/v3/objects/contacts`;
            const response = await this.makeHubspotRequest({ endpoint, method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating contact: ${error}`, params);
        }
    }
}
class GetContactTool extends BaseHubspotTool {
    constructor(args) {
        const toolInput = {
            name: 'get_contact',
            description: 'Get a specific contact from HubSpot CRM',
            schema: GetContactSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            privateAppToken: args.privateAppToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/crm/v3/objects/contacts/${params.contactId}`;
            const response = await this.makeHubspotRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting contact: ${error}`, params);
        }
    }
}
class UpdateContactTool extends BaseHubspotTool {
    constructor(args) {
        const toolInput = {
            name: 'update_contact',
            description: 'Update an existing contact in HubSpot CRM',
            schema: UpdateContactSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        };
        super({
            ...toolInput,
            privateAppToken: args.privateAppToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const body = { properties: params.properties };
            const endpoint = `/crm/v3/objects/contacts/${params.contactId}`;
            const response = await this.makeHubspotRequest({ endpoint, method: 'PATCH', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating contact: ${error}`, params);
        }
    }
}
// Deal Tools
class ListDealsTool extends BaseHubspotTool {
    constructor(args) {
        const toolInput = {
            name: 'list_deals',
            description: 'List deals from HubSpot CRM',
            schema: ListDealsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            privateAppToken: args.privateAppToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const queryParams = new URLSearchParams();
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.after)
                queryParams.append('after', params.after);
            const endpoint = `/crm/v3/objects/deals?${queryParams.toString()}`;
            const response = await this.makeHubspotRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing deals: ${error}`, params);
        }
    }
}
class CreateDealTool extends BaseHubspotTool {
    constructor(args) {
        const toolInput = {
            name: 'create_deal',
            description: 'Create a new deal in HubSpot CRM',
            schema: CreateDealSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            privateAppToken: args.privateAppToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const body = { properties: params.properties };
            const endpoint = `/crm/v3/objects/deals`;
            const response = await this.makeHubspotRequest({ endpoint, method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating deal: ${error}`, params);
        }
    }
}
const createHubspotTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const privateAppToken = args?.privateAppToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_contacts')) {
        tools.push(new ListContactsTool({
            privateAppToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('create_contact')) {
        tools.push(new CreateContactTool({
            privateAppToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_contact')) {
        tools.push(new GetContactTool({
            privateAppToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('update_contact')) {
        tools.push(new UpdateContactTool({
            privateAppToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_deals')) {
        tools.push(new ListDealsTool({
            privateAppToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('create_deal')) {
        tools.push(new CreateDealTool({
            privateAppToken,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createHubspotTools = createHubspotTools;
//# sourceMappingURL=core.js.map