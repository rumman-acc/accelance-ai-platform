"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createXeroTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Xero API for managing invoices, contacts, and accounts`;
const XERO_BASE_URL = 'https://api.xero.com/api.xro/2.0';
// Define schemas for different Xero operations
const ListContactsSchema = v3_1.z.object({});
const CreateContactSchema = v3_1.z.object({
    name: v3_1.z.string().describe('The contact name'),
    email: v3_1.z.string().optional().describe('The contact email address')
});
const ListInvoicesSchema = v3_1.z.object({});
const CreateInvoiceSchema = v3_1.z.object({
    contactId: v3_1.z.string().describe('The Xero ContactID to bill'),
    description: v3_1.z.string().describe('Description of the line item'),
    amount: v3_1.z.number().describe('The unit amount for the line item')
});
const ListAccountsSchema = v3_1.z.object({});
class BaseXeroTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.tenantId = '';
        this.accessToken = '';
        this.tenantId = args.tenantId ?? '';
        this.accessToken = args.accessToken ?? '';
    }
    async makeXeroRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${XERO_BASE_URL}${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'xero-tenant-id': this.tenantId,
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
            throw new Error(`Xero API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListContactsTool extends BaseXeroTool {
    constructor(args) {
        const toolInput = {
            name: 'list_contacts',
            description: 'List all contacts in Xero',
            schema: ListContactsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const response = await this.makeXeroRequest({ endpoint: '/Contacts', params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing contacts: ${error}`, params);
        }
    }
}
class CreateContactTool extends BaseXeroTool {
    constructor(args) {
        const toolInput = {
            name: 'create_contact',
            description: 'Create a new contact in Xero',
            schema: CreateContactSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const body = { Contacts: [{ Name: params.name, EmailAddress: params.email }] };
            const response = await this.makeXeroRequest({ endpoint: '/Contacts', method: 'PUT', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating contact: ${error}`, params);
        }
    }
}
class ListInvoicesTool extends BaseXeroTool {
    constructor(args) {
        const toolInput = {
            name: 'list_invoices',
            description: 'List all invoices in Xero',
            schema: ListInvoicesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const response = await this.makeXeroRequest({ endpoint: '/Invoices', params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing invoices: ${error}`, params);
        }
    }
}
class CreateInvoiceTool extends BaseXeroTool {
    constructor(args) {
        const toolInput = {
            name: 'create_invoice',
            description: 'Create a new accounts receivable invoice in Xero',
            schema: CreateInvoiceSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const body = {
                Invoices: [
                    {
                        Type: 'ACCREC',
                        Contact: { ContactID: params.contactId },
                        LineItems: [
                            {
                                Description: params.description,
                                Quantity: 1,
                                UnitAmount: params.amount,
                                AccountCode: '200'
                            }
                        ]
                    }
                ]
            };
            const response = await this.makeXeroRequest({ endpoint: '/Invoices', method: 'PUT', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating invoice: ${error}`, params);
        }
    }
}
class ListAccountsTool extends BaseXeroTool {
    constructor(args) {
        const toolInput = {
            name: 'list_accounts',
            description: 'List all accounts in the Xero chart of accounts',
            schema: ListAccountsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            tenantId: args.tenantId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const response = await this.makeXeroRequest({ endpoint: '/Accounts', params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing accounts: ${error}`, params);
        }
    }
}
const createXeroTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const tenantId = args?.tenantId || '';
    const accessToken = args?.accessToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    if (actions.includes('list_contacts')) {
        tools.push(new ListContactsTool({ tenantId, accessToken, maxOutputLength }));
    }
    if (actions.includes('create_contact')) {
        tools.push(new CreateContactTool({ tenantId, accessToken, maxOutputLength }));
    }
    if (actions.includes('list_invoices')) {
        tools.push(new ListInvoicesTool({ tenantId, accessToken, maxOutputLength }));
    }
    if (actions.includes('create_invoice')) {
        tools.push(new CreateInvoiceTool({ tenantId, accessToken, maxOutputLength }));
    }
    if (actions.includes('list_accounts')) {
        tools.push(new ListAccountsTool({ tenantId, accessToken, maxOutputLength }));
    }
    return tools;
};
exports.createXeroTools = createXeroTools;
//# sourceMappingURL=core.js.map