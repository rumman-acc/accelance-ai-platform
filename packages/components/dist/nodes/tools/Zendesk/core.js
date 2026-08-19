"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZendeskTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Zendesk API for managing support tickets`;
// Define schemas for different Zendesk operations
const ListTicketsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(25).describe('Maximum number of tickets to return')
});
const CreateTicketSchema = v3_1.z.object({
    subject: v3_1.z.string().describe('Subject of the ticket'),
    commentBody: v3_1.z.string().describe('Body of the initial comment on the ticket'),
    priority: v3_1.z.string().optional().describe('urgent, high, normal, or low')
});
const GetTicketSchema = v3_1.z.object({
    ticketId: v3_1.z.string().describe('ID of the ticket')
});
const UpdateTicketSchema = v3_1.z.object({
    ticketId: v3_1.z.string().describe('ID of the ticket'),
    status: v3_1.z.string().optional().describe('new, open, pending, hold, solved, closed'),
    commentBody: v3_1.z.string().optional().describe('Body of the comment to add to the ticket')
});
const SearchTicketsSchema = v3_1.z.object({
    query: v3_1.z.string().describe('Zendesk search syntax, e.g. "type:ticket status:open"')
});
class BaseZendeskTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.subdomain = '';
        this.email = '';
        this.apiToken = '';
        this.subdomain = args.subdomain ?? '';
        this.email = args.email ?? '';
        this.apiToken = args.apiToken ?? '';
    }
    async makeZendeskRequest({ endpoint, method = 'GET', body, params }) {
        const url = `https://${this.subdomain}.zendesk.com/api/v2/${endpoint}`;
        const auth = Buffer.from(`${this.email}/token:${this.apiToken}`).toString('base64');
        const authHeader = `Basic ${auth}`;
        const headers = {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Zendesk API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListTicketsTool extends BaseZendeskTool {
    constructor(args) {
        const toolInput = {
            name: 'list_tickets',
            description: 'List tickets from Zendesk',
            schema: ListTicketsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const limit = params.limit || 25;
            const endpoint = `tickets.json?per_page=${limit}`;
            const response = await this.makeZendeskRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing tickets: ${error}`, params);
        }
    }
}
class CreateTicketTool extends BaseZendeskTool {
    constructor(args) {
        const toolInput = {
            name: 'create_ticket',
            description: 'Create a new ticket in Zendesk',
            schema: CreateTicketSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const ticketData = {
                ticket: {
                    subject: params.subject,
                    comment: {
                        body: params.commentBody
                    }
                }
            };
            if (params.priority) {
                ticketData.ticket.priority = params.priority;
            }
            const endpoint = 'tickets.json';
            const response = await this.makeZendeskRequest({ endpoint, method: 'POST', body: ticketData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating ticket: ${error}`, params);
        }
    }
}
class GetTicketTool extends BaseZendeskTool {
    constructor(args) {
        const toolInput = {
            name: 'get_ticket',
            description: 'Get a specific ticket from Zendesk',
            schema: GetTicketSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `tickets/${params.ticketId}.json`;
            const response = await this.makeZendeskRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting ticket: ${error}`, params);
        }
    }
}
class UpdateTicketTool extends BaseZendeskTool {
    constructor(args) {
        const toolInput = {
            name: 'update_ticket',
            description: 'Update an existing ticket in Zendesk',
            schema: UpdateTicketSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const updateData = {
                ticket: {}
            };
            if (params.status)
                updateData.ticket.status = params.status;
            if (params.commentBody) {
                updateData.ticket.comment = {
                    body: params.commentBody
                };
            }
            const endpoint = `tickets/${params.ticketId}.json`;
            const response = await this.makeZendeskRequest({ endpoint, method: 'PUT', body: updateData, params });
            return response || 'Ticket updated successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating ticket: ${error}`, params);
        }
    }
}
class SearchTicketsTool extends BaseZendeskTool {
    constructor(args) {
        const toolInput = {
            name: 'search_tickets',
            description: 'Search for tickets in Zendesk',
            schema: SearchTicketsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            subdomain: args.subdomain,
            email: args.email,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `search.json?query=${encodeURIComponent(params.query)}`;
            const response = await this.makeZendeskRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error searching tickets: ${error}`, params);
        }
    }
}
const createZendeskTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const subdomain = args?.subdomain || '';
    const email = args?.email || '';
    const apiToken = args?.apiToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_tickets')) {
        tools.push(new ListTicketsTool({
            subdomain,
            email,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('create_ticket')) {
        tools.push(new CreateTicketTool({
            subdomain,
            email,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_ticket')) {
        tools.push(new GetTicketTool({
            subdomain,
            email,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('update_ticket')) {
        tools.push(new UpdateTicketTool({
            subdomain,
            email,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('search_tickets')) {
        tools.push(new SearchTicketsTool({
            subdomain,
            email,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createZendeskTools = createZendeskTools;
//# sourceMappingURL=core.js.map