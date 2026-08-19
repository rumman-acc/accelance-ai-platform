"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuickBooksTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access QuickBooks Online API for managing invoices, customers, and accounts`;
// Define schemas for different QuickBooks operations
const QuerySchema = v3_1.z.object({
    query: v3_1.z.string().describe('QuickBooks SQL-like query, e.g. "SELECT * FROM Customer MAXRESULTS 10"')
});
const CreateCustomerSchema = v3_1.z.object({
    displayName: v3_1.z.string().describe('The display name of the customer to create')
});
const GetCustomerSchema = v3_1.z.object({
    customerId: v3_1.z.string().describe('The QuickBooks customer ID')
});
const CreateInvoiceSchema = v3_1.z.object({
    customerId: v3_1.z.string().describe('The QuickBooks customer ID to bill'),
    amount: v3_1.z.number().describe('The invoice line amount')
});
const GetInvoiceSchema = v3_1.z.object({
    invoiceId: v3_1.z.string().describe('The QuickBooks invoice ID')
});
class BaseQuickBooksTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.realmId = '';
        this.accessToken = '';
        this.realmId = args.realmId ?? '';
        this.accessToken = args.accessToken ?? '';
    }
    async makeQuickBooksRequest({ endpoint, method = 'GET', body, params }) {
        const url = `https://quickbooks.api.intuit.com/v3/company/${this.realmId}/${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
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
            throw new Error(`QuickBooks API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class QueryTool extends BaseQuickBooksTool {
    constructor(args) {
        const toolInput = {
            name: 'query',
            description: 'Run a QuickBooks SQL-like query and return the matching records',
            schema: QuerySchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `query?query=${encodeURIComponent(params.query)}`;
            const response = await this.makeQuickBooksRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error running query: ${error}`, params);
        }
    }
}
class CreateCustomerTool extends BaseQuickBooksTool {
    constructor(args) {
        const toolInput = {
            name: 'create_customer',
            description: 'Create a new QuickBooks customer',
            schema: CreateCustomerSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `customer`;
            const body = { DisplayName: params.displayName };
            const response = await this.makeQuickBooksRequest({ endpoint, method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating customer: ${error}`, params);
        }
    }
}
class GetCustomerTool extends BaseQuickBooksTool {
    constructor(args) {
        const toolInput = {
            name: 'get_customer',
            description: 'Get a specific QuickBooks customer by ID',
            schema: GetCustomerSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `customer/${params.customerId}`;
            const response = await this.makeQuickBooksRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting customer: ${error}`, params);
        }
    }
}
class CreateInvoiceTool extends BaseQuickBooksTool {
    constructor(args) {
        const toolInput = {
            name: 'create_invoice',
            description: 'Create a new QuickBooks invoice for a customer',
            schema: CreateInvoiceSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `invoice`;
            const body = {
                CustomerRef: { value: params.customerId },
                Line: [
                    {
                        Amount: params.amount,
                        DetailType: 'SalesItemLineDetail',
                        SalesItemLineDetail: { ItemRef: { value: '1' } }
                    }
                ]
            };
            const response = await this.makeQuickBooksRequest({ endpoint, method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating invoice: ${error}`, params);
        }
    }
}
class GetInvoiceTool extends BaseQuickBooksTool {
    constructor(args) {
        const toolInput = {
            name: 'get_invoice',
            description: 'Get a specific QuickBooks invoice by ID',
            schema: GetInvoiceSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            realmId: args.realmId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `invoice/${params.invoiceId}`;
            const response = await this.makeQuickBooksRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting invoice: ${error}`, params);
        }
    }
}
const createQuickBooksTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const realmId = args?.realmId || '';
    const accessToken = args?.accessToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    if (actions.includes('query')) {
        tools.push(new QueryTool({ realmId, accessToken, maxOutputLength }));
    }
    if (actions.includes('create_customer')) {
        tools.push(new CreateCustomerTool({ realmId, accessToken, maxOutputLength }));
    }
    if (actions.includes('get_customer')) {
        tools.push(new GetCustomerTool({ realmId, accessToken, maxOutputLength }));
    }
    if (actions.includes('create_invoice')) {
        tools.push(new CreateInvoiceTool({ realmId, accessToken, maxOutputLength }));
    }
    if (actions.includes('get_invoice')) {
        tools.push(new GetInvoiceTool({ realmId, accessToken, maxOutputLength }));
    }
    return tools;
};
exports.createQuickBooksTools = createQuickBooksTools;
//# sourceMappingURL=core.js.map