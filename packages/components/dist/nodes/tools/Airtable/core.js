"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAirtableTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Airtable API for reading and writing records in a base`;
// Define schemas for different Airtable operations
const ListRecordsSchema = v3_1.z.object({
    maxRecords: v3_1.z.number().optional().default(20).describe('Maximum number of records to return'),
    filterByFormula: v3_1.z.string().optional().describe(`Airtable formula to filter records, e.g. "{Status}='Done'"`)
});
const CreateRecordSchema = v3_1.z.object({
    fields: v3_1.z.record(v3_1.z.any()).describe('Field name/value pairs matching the table columns')
});
const GetRecordSchema = v3_1.z.object({
    recordId: v3_1.z.string().describe('ID of the record to retrieve')
});
const UpdateRecordSchema = v3_1.z.object({
    recordId: v3_1.z.string().describe('ID of the record to update'),
    fields: v3_1.z.record(v3_1.z.any()).describe('Field name/value pairs matching the table columns')
});
const DeleteRecordSchema = v3_1.z.object({
    recordId: v3_1.z.string().describe('ID of the record to delete')
});
class BaseAirtableTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.personalAccessToken = '';
        this.baseId = '';
        this.tableName = '';
        this.personalAccessToken = args.personalAccessToken ?? '';
        this.baseId = args.baseId ?? '';
        this.tableName = args.tableName ?? '';
        this.authConfig = args.authConfig;
    }
    async makeAirtableRequest({ endpoint, method = 'GET', body, params }) {
        const baseUrl = `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(this.tableName)}`;
        const url = `${baseUrl}${endpoint}`;
        const token = this.authConfig?.personalAccessToken ?? this.personalAccessToken;
        const headers = {
            Authorization: `Bearer ${token}`,
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
            throw new Error(`Airtable API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListRecordsTool extends BaseAirtableTool {
    constructor(args) {
        const toolInput = {
            name: 'list_records',
            description: 'List records from an Airtable table',
            schema: ListRecordsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const queryParams = new URLSearchParams();
        if (params.maxRecords)
            queryParams.append('maxRecords', params.maxRecords.toString());
        if (params.filterByFormula)
            queryParams.append('filterByFormula', params.filterByFormula);
        const queryString = queryParams.toString();
        const endpoint = queryString ? `?${queryString}` : '';
        try {
            const response = await this.makeAirtableRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing records: ${error}`, params);
        }
    }
}
class CreateRecordTool extends BaseAirtableTool {
    constructor(args) {
        const toolInput = {
            name: 'create_record',
            description: 'Create a new record in an Airtable table',
            schema: CreateRecordSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const body = { fields: params.fields };
            const response = await this.makeAirtableRequest({ endpoint: '', method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating record: ${error}`, params);
        }
    }
}
class GetRecordTool extends BaseAirtableTool {
    constructor(args) {
        const toolInput = {
            name: 'get_record',
            description: 'Get a specific record from an Airtable table',
            schema: GetRecordSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.recordId}`;
            const response = await this.makeAirtableRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting record: ${error}`, params);
        }
    }
}
class UpdateRecordTool extends BaseAirtableTool {
    constructor(args) {
        const toolInput = {
            name: 'update_record',
            description: 'Update an existing record in an Airtable table',
            schema: UpdateRecordSchema,
            baseUrl: '',
            method: 'PATCH',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.recordId}`;
            const body = { fields: params.fields };
            const response = await this.makeAirtableRequest({ endpoint, method: 'PATCH', body, params });
            return response || 'Record updated successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating record: ${error}`, params);
        }
    }
}
class DeleteRecordTool extends BaseAirtableTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_record',
            description: 'Delete a record from an Airtable table',
            schema: DeleteRecordSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        };
        super({
            ...toolInput,
            personalAccessToken: args.personalAccessToken,
            baseId: args.baseId,
            tableName: args.tableName,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/${params.recordId}`;
            const response = await this.makeAirtableRequest({ endpoint, method: 'DELETE', params });
            return response || 'Record deleted successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting record: ${error}`, params);
        }
    }
}
const createAirtableTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const personalAccessToken = args?.personalAccessToken || '';
    const baseId = args?.baseId || '';
    const tableName = args?.tableName || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    const authConfig = args?.authConfig;
    if (actions.includes('list_records')) {
        tools.push(new ListRecordsTool({
            personalAccessToken,
            baseId,
            tableName,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    if (actions.includes('create_record')) {
        tools.push(new CreateRecordTool({
            personalAccessToken,
            baseId,
            tableName,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    if (actions.includes('get_record')) {
        tools.push(new GetRecordTool({
            personalAccessToken,
            baseId,
            tableName,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    if (actions.includes('update_record')) {
        tools.push(new UpdateRecordTool({
            personalAccessToken,
            baseId,
            tableName,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    if (actions.includes('delete_record')) {
        tools.push(new DeleteRecordTool({
            personalAccessToken,
            baseId,
            tableName,
            maxOutputLength,
            defaultParams,
            authConfig
        }));
    }
    return tools;
};
exports.createAirtableTools = createAirtableTools;
//# sourceMappingURL=core.js.map