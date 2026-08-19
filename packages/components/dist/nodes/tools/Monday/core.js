"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMondayTools = exports.desc = void 0;
exports.makeMondayRequest = makeMondayRequest;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access monday.com API for managing boards and items`;
const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_API_VERSION = '2026-07';
// Action schemas
const ListBoardsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(25).describe('Maximum number of boards to return')
});
const CreateItemSchema = v3_1.z.object({
    boardId: v3_1.z.string().describe('ID of the board to create the item on'),
    itemName: v3_1.z.string().describe('Name of the new item')
});
const ListItemsSchema = v3_1.z.object({
    boardId: v3_1.z.string().describe('ID of the board to list items from')
});
const GetItemSchema = v3_1.z.object({
    itemId: v3_1.z.string().describe('ID of the item to retrieve')
});
const UpdateItemColumnSchema = v3_1.z.object({
    boardId: v3_1.z.string().describe('ID of the board the item belongs to'),
    itemId: v3_1.z.string().describe('ID of the item to update'),
    columnId: v3_1.z.string().describe('ID of the column to update'),
    value: v3_1.z.string().describe('New value for the column')
});
/**
 * Makes a request to the monday.com GraphQL API.
 * monday.com exposes a single endpoint and returns HTTP 200 even when the
 * GraphQL query/mutation itself failed, so callers must inspect the `errors`
 * array in the response body.
 */
async function makeMondayRequest(apiToken, query, variables) {
    const headers = {
        Authorization: apiToken,
        'Content-Type': 'application/json',
        'API-Version': MONDAY_API_VERSION
    };
    const response = await (0, httpSecurity_1.secureFetch)(MONDAY_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`monday.com API Error ${response.status}: ${response.statusText} - ${errorText}`);
    }
    const json = await response.json();
    if (Array.isArray(json?.errors) && json.errors.length > 0) {
        throw new Error(json.errors[0]?.message || 'monday.com API returned an error');
    }
    return json?.data;
}
class BaseMondayTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.apiToken = '';
        this.apiToken = args.apiToken ?? '';
    }
}
class ListBoardsTool extends BaseMondayTool {
    constructor(args) {
        const toolInput = {
            name: 'list_boards',
            description: 'List boards on monday.com',
            schema: ListBoardsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const query = `query ($limit: Int) { boards(limit: $limit) { id name } }`;
            const data = await makeMondayRequest(this.apiToken, query, { limit: params.limit });
            return JSON.stringify(data) + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing boards: ${error}`, params);
        }
    }
}
class CreateItemTool extends BaseMondayTool {
    constructor(args) {
        const toolInput = {
            name: 'create_item',
            description: 'Create a new item on a monday.com board',
            schema: CreateItemSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const query = `mutation ($boardId: ID!, $itemName: String!) { create_item(board_id: $boardId, item_name: $itemName) { id } }`;
            const data = await makeMondayRequest(this.apiToken, query, {
                boardId: params.boardId,
                itemName: params.itemName
            });
            return JSON.stringify(data) + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating item: ${error}`, params);
        }
    }
}
class ListItemsTool extends BaseMondayTool {
    constructor(args) {
        const toolInput = {
            name: 'list_items',
            description: 'List items on a monday.com board',
            schema: ListItemsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const query = `query ($boardId: ID!) { boards(ids: [$boardId]) { items_page { items { id name } } } }`;
            const data = await makeMondayRequest(this.apiToken, query, { boardId: params.boardId });
            return JSON.stringify(data) + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing items: ${error}`, params);
        }
    }
}
class GetItemTool extends BaseMondayTool {
    constructor(args) {
        const toolInput = {
            name: 'get_item',
            description: 'Get a specific item from monday.com',
            schema: GetItemSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const query = `query ($itemId: ID!) { items(ids: [$itemId]) { id name column_values { id text } } }`;
            const data = await makeMondayRequest(this.apiToken, query, { itemId: params.itemId });
            return JSON.stringify(data) + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting item: ${error}`, params);
        }
    }
}
class UpdateItemColumnTool extends BaseMondayTool {
    constructor(args) {
        const toolInput = {
            name: 'update_item_column',
            description: 'Update a column value on a monday.com item',
            schema: UpdateItemColumnSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const query = `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) { change_simple_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id } }`;
            const data = await makeMondayRequest(this.apiToken, query, {
                boardId: params.boardId,
                itemId: params.itemId,
                columnId: params.columnId,
                value: params.value
            });
            return JSON.stringify(data) + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating item column: ${error}`, params);
        }
    }
}
const createMondayTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const apiToken = args?.apiToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    if (actions.includes('list_boards')) {
        tools.push(new ListBoardsTool({ apiToken, maxOutputLength }));
    }
    if (actions.includes('create_item')) {
        tools.push(new CreateItemTool({ apiToken, maxOutputLength }));
    }
    if (actions.includes('list_items')) {
        tools.push(new ListItemsTool({ apiToken, maxOutputLength }));
    }
    if (actions.includes('get_item')) {
        tools.push(new GetItemTool({ apiToken, maxOutputLength }));
    }
    if (actions.includes('update_item_column')) {
        tools.push(new UpdateItemColumnTool({ apiToken, maxOutputLength }));
    }
    return tools;
};
exports.createMondayTools = createMondayTools;
//# sourceMappingURL=core.js.map