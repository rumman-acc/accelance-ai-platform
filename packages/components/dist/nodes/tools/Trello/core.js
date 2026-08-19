"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrelloTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Trello API for managing boards and cards`;
// Define schemas for different Trello operations
const ListBoardsSchema = v3_1.z.object({});
const ListCardsSchema = v3_1.z.object({
    boardId: v3_1.z.string().describe('ID of the board to list cards from')
});
const CreateCardSchema = v3_1.z.object({
    listId: v3_1.z.string().describe('ID of the list to create the card in'),
    name: v3_1.z.string().describe('Name/title of the card'),
    desc: v3_1.z.string().optional().describe('Description of the card')
});
const GetCardSchema = v3_1.z.object({
    cardId: v3_1.z.string().describe('ID of the card to retrieve')
});
const UpdateCardSchema = v3_1.z.object({
    cardId: v3_1.z.string().describe('ID of the card to update'),
    name: v3_1.z.string().optional().describe('Updated name/title of the card'),
    desc: v3_1.z.string().optional().describe('Updated description of the card'),
    closed: v3_1.z.boolean().optional().describe('Whether the card should be archived (closed)')
});
class BaseTrelloTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.apiKey = '';
        this.apiToken = '';
        this.trelloBaseUrl = 'https://api.trello.com/1';
        this.apiKey = args.apiKey ?? '';
        this.apiToken = args.apiToken ?? '';
    }
    async makeTrelloRequest({ endpoint, method = 'GET', queryParams, params }) {
        const mergedQueryParams = new URLSearchParams(queryParams ?? {});
        mergedQueryParams.append('key', this.apiKey);
        mergedQueryParams.append('token', this.apiToken);
        const url = `${this.trelloBaseUrl}${endpoint}?${mergedQueryParams.toString()}`;
        const headers = {
            Accept: 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method,
            headers
        };
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Trello API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListBoardsTool extends BaseTrelloTool {
    constructor(args) {
        const toolInput = {
            name: 'list_boards',
            description: 'List all Trello boards for the authenticated user',
            schema: ListBoardsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const response = await this.makeTrelloRequest({
                endpoint: '/members/me/boards',
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing boards: ${error}`, params);
        }
    }
}
class ListCardsTool extends BaseTrelloTool {
    constructor(args) {
        const toolInput = {
            name: 'list_cards',
            description: 'List all cards on a Trello board',
            schema: ListCardsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/boards/${params.boardId}/cards`;
            const response = await this.makeTrelloRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing cards: ${error}`, params);
        }
    }
}
class CreateCardTool extends BaseTrelloTool {
    constructor(args) {
        const toolInput = {
            name: 'create_card',
            description: 'Create a new card in a Trello list',
            schema: CreateCardSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const queryParams = {
                idList: params.listId,
                name: params.name
            };
            if (params.desc)
                queryParams.desc = params.desc;
            const response = await this.makeTrelloRequest({
                endpoint: '/cards',
                method: 'POST',
                queryParams,
                params
            });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating card: ${error}`, params);
        }
    }
}
class GetCardTool extends BaseTrelloTool {
    constructor(args) {
        const toolInput = {
            name: 'get_card',
            description: 'Get a specific card from Trello',
            schema: GetCardSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/cards/${params.cardId}`;
            const response = await this.makeTrelloRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting card: ${error}`, params);
        }
    }
}
class UpdateCardTool extends BaseTrelloTool {
    constructor(args) {
        const toolInput = {
            name: 'update_card',
            description: 'Update an existing Trello card',
            schema: UpdateCardSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            apiKey: args.apiKey,
            apiToken: args.apiToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const queryParams = {};
            if (params.name !== undefined)
                queryParams.name = params.name;
            if (params.desc !== undefined)
                queryParams.desc = params.desc;
            if (params.closed !== undefined)
                queryParams.closed = String(params.closed);
            const endpoint = `/cards/${params.cardId}`;
            const response = await this.makeTrelloRequest({
                endpoint,
                method: 'PUT',
                queryParams,
                params
            });
            return response || 'Card updated successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating card: ${error}`, params);
        }
    }
}
const createTrelloTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const apiKey = args?.apiKey || '';
    const apiToken = args?.apiToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_boards')) {
        tools.push(new ListBoardsTool({
            apiKey,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_cards')) {
        tools.push(new ListCardsTool({
            apiKey,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('create_card')) {
        tools.push(new CreateCardTool({
            apiKey,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_card')) {
        tools.push(new GetCardTool({
            apiKey,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('update_card')) {
        tools.push(new UpdateCardTool({
            apiKey,
            apiToken,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createTrelloTools = createTrelloTools;
//# sourceMappingURL=core.js.map