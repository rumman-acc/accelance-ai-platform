"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTwilioTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to send SMS messages and make phone calls via the Twilio API`;
// Define schemas for different Twilio operations
const SendSmsSchema = v3_1.z.object({
    to: v3_1.z.string().describe('Recipient phone number in E.164 format, e.g. +15551234567'),
    from: v3_1.z.string().describe('Your Twilio phone number in E.164 format'),
    body: v3_1.z.string().describe('SMS message text')
});
const ListMessagesSchema = v3_1.z.object({
    pageSize: v3_1.z.number().optional().default(20).describe('Maximum number of messages to return')
});
const GetMessageSchema = v3_1.z.object({
    messageSid: v3_1.z.string().describe('SID of the message to retrieve')
});
const MakeCallSchema = v3_1.z.object({
    to: v3_1.z.string().describe('Recipient phone number in E.164 format'),
    from: v3_1.z.string().describe('Your Twilio phone number in E.164 format'),
    url: v3_1.z.string().describe('URL Twilio will fetch TwiML instructions from for this call')
});
const ListCallsSchema = v3_1.z.object({
    pageSize: v3_1.z.number().optional().default(20).describe('Maximum number of calls to return')
});
class BaseTwilioTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.accountSid = '';
        this.authToken = '';
        this.accountSid = args.accountSid ?? '';
        this.authToken = args.authToken ?? '';
        this.authConfig = args.authConfig;
    }
    async makeTwilioRequest({ endpoint, method = 'GET', body, params }) {
        const accountSid = this.authConfig?.accountSid ?? this.accountSid;
        const authToken = this.authConfig?.authToken ?? this.authToken;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}${endpoint}`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const authHeader = `Basic ${auth}`;
        const headers = {
            Authorization: authHeader,
            Accept: 'application/json',
            ...this.headers
        };
        const fetchOptions = {
            method,
            headers
        };
        if (body) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            fetchOptions.body = new URLSearchParams(body).toString();
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Twilio API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class SendSmsTool extends BaseTwilioTool {
    constructor(args) {
        const toolInput = {
            name: 'send_sms',
            description: 'Send an SMS message via Twilio',
            schema: SendSmsSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const formBody = {
                To: params.to,
                From: params.from,
                Body: params.body
            };
            const response = await this.makeTwilioRequest({ endpoint: '/Messages.json', method: 'POST', body: formBody, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error sending SMS: ${error}`, params);
        }
    }
}
class ListMessagesTool extends BaseTwilioTool {
    constructor(args) {
        const toolInput = {
            name: 'list_messages',
            description: 'List SMS messages sent and received via Twilio',
            schema: ListMessagesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `/Messages.json?PageSize=${params.pageSize}`;
            const response = await this.makeTwilioRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing messages: ${error}`, params);
        }
    }
}
class GetMessageTool extends BaseTwilioTool {
    constructor(args) {
        const toolInput = {
            name: 'get_message',
            description: 'Get a specific SMS message from Twilio',
            schema: GetMessageSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `/Messages/${params.messageSid}.json`;
            const response = await this.makeTwilioRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting message: ${error}`, params);
        }
    }
}
class MakeCallTool extends BaseTwilioTool {
    constructor(args) {
        const toolInput = {
            name: 'make_call',
            description: 'Make a phone call via Twilio',
            schema: MakeCallSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const formBody = {
                To: params.to,
                From: params.from,
                Url: params.url
            };
            const response = await this.makeTwilioRequest({ endpoint: '/Calls.json', method: 'POST', body: formBody, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error making call: ${error}`, params);
        }
    }
}
class ListCallsTool extends BaseTwilioTool {
    constructor(args) {
        const toolInput = {
            name: 'list_calls',
            description: 'List phone calls made and received via Twilio',
            schema: ListCallsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accountSid: args.accountSid,
            authToken: args.authToken,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        });
    }
    async _call(arg) {
        const params = { ...arg };
        try {
            const endpoint = `/Calls.json?PageSize=${params.pageSize}`;
            const response = await this.makeTwilioRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing calls: ${error}`, params);
        }
    }
}
const createTwilioTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const accountSid = args?.accountSid || '';
    const authToken = args?.authToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const authConfig = args?.authConfig;
    if (actions.includes('send_sms')) {
        tools.push(new SendSmsTool({
            accountSid,
            authToken,
            maxOutputLength,
            authConfig
        }));
    }
    if (actions.includes('list_messages')) {
        tools.push(new ListMessagesTool({
            accountSid,
            authToken,
            maxOutputLength,
            authConfig
        }));
    }
    if (actions.includes('get_message')) {
        tools.push(new GetMessageTool({
            accountSid,
            authToken,
            maxOutputLength,
            authConfig
        }));
    }
    if (actions.includes('make_call')) {
        tools.push(new MakeCallTool({
            accountSid,
            authToken,
            maxOutputLength,
            authConfig
        }));
    }
    if (actions.includes('list_calls')) {
        tools.push(new ListCallsTool({
            accountSid,
            authToken,
            maxOutputLength,
            authConfig
        }));
    }
    return tools;
};
exports.createTwilioTools = createTwilioTools;
//# sourceMappingURL=core.js.map