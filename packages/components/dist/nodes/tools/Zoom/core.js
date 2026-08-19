"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZoomTools = exports.desc = void 0;
exports.getZoomAccessToken = getZoomAccessToken;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access Zoom API for managing meetings and users`;
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';
const ZOOM_OAUTH_TOKEN_URL = 'https://zoom.us/oauth/token';
// Fetches a fresh Server-to-Server OAuth access token from Zoom.
// A new token is requested per tool invocation rather than cached/persisted.
async function getZoomAccessToken(accountId, clientId, clientSecret) {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const body = new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: accountId
    }).toString();
    const response = await (0, httpSecurity_1.secureFetch)(ZOOM_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zoom OAuth Error ${response.status}: ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    return data.access_token;
}
// Define schemas for different Zoom operations
const ListMeetingsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(30).describe('Maximum number of meetings to return')
});
const CreateMeetingSchema = v3_1.z.object({
    topic: v3_1.z.string().describe('Meeting topic'),
    startTime: v3_1.z.string().describe('ISO 8601, e.g. 2026-09-01T15:00:00Z'),
    duration: v3_1.z.number().describe('minutes')
});
const GetMeetingSchema = v3_1.z.object({
    meetingId: v3_1.z.string().describe('ID of the meeting')
});
const DeleteMeetingSchema = v3_1.z.object({
    meetingId: v3_1.z.string().describe('ID of the meeting to delete')
});
const ListUsersSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(30).describe('Maximum number of users to return')
});
class BaseZoomTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.accountId = '';
        this.clientId = '';
        this.clientSecret = '';
        this.accountId = args.accountId ?? '';
        this.clientId = args.clientId ?? '';
        this.clientSecret = args.clientSecret ?? '';
    }
    async makeZoomRequest({ endpoint, method = 'GET', body, params }) {
        const accessToken = await getZoomAccessToken(this.accountId, this.clientId, this.clientSecret);
        const url = `${ZOOM_API_BASE_URL}${endpoint}`;
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
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
            throw new Error(`Zoom API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        // Zoom returns HTTP 204 with no body for successful deletes
        if (response.status === 204) {
            return 'Operation completed successfully' + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class ListMeetingsTool extends BaseZoomTool {
    constructor(args) {
        const toolInput = {
            name: 'list_meetings',
            description: 'List scheduled Zoom meetings for the current user',
            schema: ListMeetingsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/users/me/meetings?page_size=${params.limit ?? 30}`;
            const response = await this.makeZoomRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing meetings: ${error}`, params);
        }
    }
}
class CreateMeetingTool extends BaseZoomTool {
    constructor(args) {
        const toolInput = {
            name: 'create_meeting',
            description: 'Create a new Zoom meeting',
            schema: CreateMeetingSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const body = {
                topic: params.topic,
                type: 2,
                start_time: params.startTime,
                duration: params.duration
            };
            const response = await this.makeZoomRequest({ endpoint: '/users/me/meetings', method: 'POST', body, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating meeting: ${error}`, params);
        }
    }
}
class GetMeetingTool extends BaseZoomTool {
    constructor(args) {
        const toolInput = {
            name: 'get_meeting',
            description: 'Get details of a specific Zoom meeting',
            schema: GetMeetingSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/meetings/${params.meetingId}`;
            const response = await this.makeZoomRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting meeting: ${error}`, params);
        }
    }
}
class DeleteMeetingTool extends BaseZoomTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_meeting',
            description: 'Delete a Zoom meeting',
            schema: DeleteMeetingSchema,
            baseUrl: '',
            method: 'DELETE',
            headers: {}
        };
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/meetings/${params.meetingId}`;
            const response = await this.makeZoomRequest({ endpoint, method: 'DELETE', params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting meeting: ${error}`, params);
        }
    }
}
class ListUsersTool extends BaseZoomTool {
    constructor(args) {
        const toolInput = {
            name: 'list_users',
            description: 'List users on the Zoom account',
            schema: ListUsersSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accountId: args.accountId,
            clientId: args.clientId,
            clientSecret: args.clientSecret,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `/users?page_size=${params.limit ?? 30}`;
            const response = await this.makeZoomRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing users: ${error}`, params);
        }
    }
}
const createZoomTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const accountId = args?.accountId || '';
    const clientId = args?.clientId || '';
    const clientSecret = args?.clientSecret || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('list_meetings')) {
        tools.push(new ListMeetingsTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }));
    }
    if (actions.includes('create_meeting')) {
        tools.push(new CreateMeetingTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }));
    }
    if (actions.includes('get_meeting')) {
        tools.push(new GetMeetingTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }));
    }
    if (actions.includes('delete_meeting')) {
        tools.push(new DeleteMeetingTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }));
    }
    if (actions.includes('list_users')) {
        tools.push(new ListUsersTool({ accountId, clientId, clientSecret, maxOutputLength, defaultParams }));
    }
    return tools;
};
exports.createZoomTools = createZoomTools;
//# sourceMappingURL=core.js.map