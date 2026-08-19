"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGmailTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const node_fetch_1 = __importDefault(require("node-fetch"));
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
exports.desc = `Use this when you want to access Gmail API for managing drafts, messages, labels, and threads`;
// Define schemas for different Gmail operations
const ListSchema = v3_1.z.object({
    maxResults: v3_1.z.number().optional().default(100).describe('Maximum number of results to return'),
    query: v3_1.z.string().optional().describe('Query string for filtering results (Gmail search syntax)')
});
const CreateDraftSchema = v3_1.z.object({
    to: v3_1.z.string().describe('Recipient email address(es), comma-separated'),
    subject: v3_1.z.string().optional().describe('Email subject'),
    body: v3_1.z.string().optional().describe('Email body content'),
    cc: v3_1.z.string().optional().describe('CC email address(es), comma-separated'),
    bcc: v3_1.z.string().optional().describe('BCC email address(es), comma-separated')
});
const UpdateDraftSchema = CreateDraftSchema.extend({
    id: v3_1.z
        .string()
        .regex(/^[A-Za-z0-9_-]+$/, 'Draft ID must contain only URL-safe characters')
        .describe('ID of the draft to update')
});
const SendMessageSchema = v3_1.z.object({
    to: v3_1.z.string().describe('Recipient email address(es), comma-separated'),
    subject: v3_1.z.string().optional().describe('Email subject'),
    body: v3_1.z.string().optional().describe('Email body content'),
    cc: v3_1.z.string().optional().describe('CC email address(es), comma-separated'),
    bcc: v3_1.z.string().optional().describe('BCC email address(es), comma-separated')
});
const GetByIdSchema = v3_1.z.object({
    id: v3_1.z.string().describe('ID of the resource')
});
const ModifySchema = v3_1.z.object({
    id: v3_1.z.string().describe('ID of the resource'),
    addLabelIds: v3_1.z.array(v3_1.z.string()).optional().describe('Label IDs to add'),
    removeLabelIds: v3_1.z.array(v3_1.z.string()).optional().describe('Label IDs to remove')
});
const CreateLabelSchema = v3_1.z.object({
    labelName: v3_1.z.string().describe('Name of the label'),
    labelColor: v3_1.z.string().optional().describe('Color of the label (hex color code)')
});
class BaseGmailTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.accessToken = '';
        this.accessToken = args.accessToken ?? '';
    }
    async makeGmailRequest(url, method = 'GET', body, params) {
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...this.headers
        };
        const response = await (0, node_fetch_1.default)(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gmail API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
    createMimeMessage(to, subject, body, cc, bcc) {
        let message = '';
        message += `To: ${to}\r\n`;
        if (cc)
            message += `Cc: ${cc}\r\n`;
        if (bcc)
            message += `Bcc: ${bcc}\r\n`;
        if (subject)
            message += `Subject: ${subject}\r\n`;
        message += `MIME-Version: 1.0\r\n`;
        message += `Content-Type: text/html; charset=utf-8\r\n`;
        message += `Content-Transfer-Encoding: base64\r\n\r\n`;
        if (body) {
            message += Buffer.from(body, 'utf-8').toString('base64');
        }
        return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
}
// Draft Tools
class ListDraftsTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'list_drafts',
            description: 'List drafts in Gmail mailbox',
            schema: ListSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const queryParams = new URLSearchParams();
        if (params.maxResults)
            queryParams.append('maxResults', params.maxResults.toString());
        if (params.query)
            queryParams.append('q', params.query);
        const url = `https://gmail.googleapis.com/gmail/v1/users/me/drafts?${queryParams.toString()}`;
        try {
            const response = await this.makeGmailRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing drafts: ${error}`, params);
        }
    }
}
class CreateDraftTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'create_draft',
            description: 'Create a new draft in Gmail',
            schema: CreateDraftSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const raw = this.createMimeMessage(params.to, params.subject, params.body, params.cc, params.bcc);
            const draftData = {
                message: {
                    raw: raw
                }
            };
            const url = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts';
            const response = await this.makeGmailRequest(url, 'POST', draftData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating draft: ${error}`, params);
        }
    }
}
class GetDraftTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'get_draft',
            description: 'Get a specific draft from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const draftId = params.draftId || params.id;
        if (!draftId) {
            return 'Error: Draft ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`;
            const response = await this.makeGmailRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting draft: ${error}`, params);
        }
    }
}
class UpdateDraftTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'update_draft',
            description: 'Update a specific draft in Gmail',
            schema: UpdateDraftSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
            method: 'PUT',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const draftId = params.draftId || params.id;
        if (!draftId) {
            return 'Error: Draft ID is required';
        }
        try {
            const raw = this.createMimeMessage(params.to, params.subject, params.body, params.cc, params.bcc);
            const draftData = {
                message: {
                    raw: raw
                }
            };
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`;
            const response = await this.makeGmailRequest(url, 'PUT', draftData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating draft: ${error}`, params);
        }
    }
}
class SendDraftTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'send_draft',
            description: 'Send a specific draft from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts/send',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const draftId = params.draftId || params.id;
        if (!draftId) {
            return 'Error: Draft ID is required';
        }
        try {
            const url = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts/send';
            const response = await this.makeGmailRequest(url, 'POST', { id: draftId }, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error sending draft: ${error}`, params);
        }
    }
}
class DeleteDraftTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_draft',
            description: 'Delete a specific draft from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
            method: 'DELETE',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const draftId = params.draftId || params.id;
        if (!draftId) {
            return 'Error: Draft ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`;
            await this.makeGmailRequest(url, 'DELETE', undefined, params);
            return `Draft ${draftId} deleted successfully`;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting draft: ${error}`, params);
        }
    }
}
// Message Tools
class ListMessagesTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'list_messages',
            description: 'List messages in Gmail mailbox',
            schema: ListSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const queryParams = new URLSearchParams();
        if (params.maxResults)
            queryParams.append('maxResults', params.maxResults.toString());
        if (params.query)
            queryParams.append('q', params.query);
        const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams.toString()}`;
        try {
            const response = await this.makeGmailRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing messages: ${error}`, params);
        }
    }
}
class GetMessageTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'get_message',
            description: 'Get a specific message from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const messageId = params.messageId || params.id;
        if (!messageId) {
            return 'Error: Message ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
            const response = await this.makeGmailRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting message: ${error}`, params);
        }
    }
}
class SendMessageTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'send_message',
            description: 'Send a new message via Gmail',
            schema: SendMessageSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const raw = this.createMimeMessage(params.to, params.subject, params.body, params.cc, params.bcc);
            const messageData = {
                raw: raw
            };
            const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
            const response = await this.makeGmailRequest(url, 'POST', messageData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error sending message: ${error}`, params);
        }
    }
}
class ModifyMessageTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'modify_message',
            description: 'Modify labels on a message in Gmail',
            schema: ModifySchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const messageId = params.messageId || params.id;
        if (!messageId) {
            return 'Error: Message ID is required';
        }
        try {
            const modifyData = {};
            if (params.addLabelIds && params.addLabelIds.length > 0) {
                modifyData.addLabelIds = params.addLabelIds;
            }
            if (params.removeLabelIds && params.removeLabelIds.length > 0) {
                modifyData.removeLabelIds = params.removeLabelIds;
            }
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
            const response = await this.makeGmailRequest(url, 'POST', modifyData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error modifying message: ${error}`, params);
        }
    }
}
class TrashMessageTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'trash_message',
            description: 'Move a message to trash in Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const messageId = params.messageId || params.id;
        if (!messageId) {
            return 'Error: Message ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`;
            const response = await this.makeGmailRequest(url, 'POST', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error moving message to trash: ${error}`, params);
        }
    }
}
class UntrashMessageTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'untrash_message',
            description: 'Remove a message from trash in Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const messageId = params.messageId || params.id;
        if (!messageId) {
            return 'Error: Message ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/untrash`;
            const response = await this.makeGmailRequest(url, 'POST', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error removing message from trash: ${error}`, params);
        }
    }
}
class DeleteMessageTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_message',
            description: 'Permanently delete a message from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
            method: 'DELETE',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const messageId = params.messageId || params.id;
        if (!messageId) {
            return 'Error: Message ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
            await this.makeGmailRequest(url, 'DELETE', undefined, params);
            return `Message ${messageId} deleted successfully`;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting message: ${error}`, params);
        }
    }
}
// Label Tools
class ListLabelsTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'list_labels',
            description: 'List labels in Gmail mailbox',
            schema: v3_1.z.object({}),
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call() {
        try {
            const url = 'https://gmail.googleapis.com/gmail/v1/users/me/labels';
            const response = await this.makeGmailRequest(url, 'GET', undefined, {});
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing labels: ${error}`, {});
        }
    }
}
class GetLabelTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'get_label',
            description: 'Get a specific label from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const labelId = params.labelId || params.id;
        if (!labelId) {
            return 'Error: Label ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/labels/${labelId}`;
            const response = await this.makeGmailRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting label: ${error}`, params);
        }
    }
}
class CreateLabelTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'create_label',
            description: 'Create a new label in Gmail',
            schema: CreateLabelSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        if (!params.labelName) {
            return 'Error: Label name is required';
        }
        try {
            const labelData = {
                name: params.labelName,
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show'
            };
            if (params.labelColor) {
                labelData.color = {
                    backgroundColor: params.labelColor
                };
            }
            const url = 'https://gmail.googleapis.com/gmail/v1/users/me/labels';
            const response = await this.makeGmailRequest(url, 'POST', labelData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating label: ${error}`, params);
        }
    }
}
class UpdateLabelTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'update_label',
            description: 'Update a label in Gmail',
            schema: CreateLabelSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
            method: 'PUT',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const labelId = params.labelId || params.id;
        if (!labelId) {
            return 'Error: Label ID is required';
        }
        try {
            const labelData = {};
            if (params.labelName) {
                labelData.name = params.labelName;
            }
            if (params.labelColor) {
                labelData.color = {
                    backgroundColor: params.labelColor
                };
            }
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/labels/${labelId}`;
            const response = await this.makeGmailRequest(url, 'PUT', labelData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating label: ${error}`, params);
        }
    }
}
class DeleteLabelTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_label',
            description: 'Delete a label from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
            method: 'DELETE',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const labelId = params.labelId || params.id;
        if (!labelId) {
            return 'Error: Label ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/labels/${labelId}`;
            await this.makeGmailRequest(url, 'DELETE', undefined, params);
            return `Label ${labelId} deleted successfully`;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting label: ${error}`, params);
        }
    }
}
// Thread Tools
class ListThreadsTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'list_threads',
            description: 'List threads in Gmail mailbox',
            schema: ListSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const queryParams = new URLSearchParams();
        if (params.maxResults)
            queryParams.append('maxResults', params.maxResults.toString());
        if (params.query)
            queryParams.append('q', params.query);
        const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads?${queryParams.toString()}`;
        try {
            const response = await this.makeGmailRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing threads: ${error}`, params);
        }
    }
}
class GetThreadTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'get_thread',
            description: 'Get a specific thread from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const threadId = params.threadId || params.id;
        if (!threadId) {
            return 'Error: Thread ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`;
            const response = await this.makeGmailRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting thread: ${error}`, params);
        }
    }
}
class ModifyThreadTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'modify_thread',
            description: 'Modify labels on a thread in Gmail',
            schema: ModifySchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const threadId = params.threadId || params.id;
        if (!threadId) {
            return 'Error: Thread ID is required';
        }
        try {
            const modifyData = {};
            if (params.addLabelIds && params.addLabelIds.length > 0) {
                modifyData.addLabelIds = params.addLabelIds;
            }
            if (params.removeLabelIds && params.removeLabelIds.length > 0) {
                modifyData.removeLabelIds = params.removeLabelIds;
            }
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`;
            const response = await this.makeGmailRequest(url, 'POST', modifyData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error modifying thread: ${error}`, params);
        }
    }
}
class TrashThreadTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'trash_thread',
            description: 'Move a thread to trash in Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const threadId = params.threadId || params.id;
        if (!threadId) {
            return 'Error: Thread ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/trash`;
            const response = await this.makeGmailRequest(url, 'POST', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error moving thread to trash: ${error}`, params);
        }
    }
}
class UntrashThreadTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'untrash_thread',
            description: 'Remove a thread from trash in Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const threadId = params.threadId || params.id;
        if (!threadId) {
            return 'Error: Thread ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/untrash`;
            const response = await this.makeGmailRequest(url, 'POST', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error removing thread from trash: ${error}`, params);
        }
    }
}
class DeleteThreadTool extends BaseGmailTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_thread',
            description: 'Permanently delete a thread from Gmail',
            schema: GetByIdSchema,
            baseUrl: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
            method: 'DELETE',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const threadId = params.threadId || params.id;
        if (!threadId) {
            return 'Error: Thread ID is required';
        }
        try {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`;
            await this.makeGmailRequest(url, 'DELETE', undefined, params);
            return `Thread ${threadId} deleted successfully`;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting thread: ${error}`, params);
        }
    }
}
const createGmailTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const accessToken = args?.accessToken || '';
    const defaultParams = args?.defaultParams || {};
    // Draft tools
    if (actions.includes('listDrafts')) {
        tools.push(new ListDraftsTool({ accessToken, defaultParams }));
    }
    if (actions.includes('createDraft')) {
        tools.push(new CreateDraftTool({ accessToken, defaultParams }));
    }
    if (actions.includes('getDraft')) {
        tools.push(new GetDraftTool({ accessToken, defaultParams }));
    }
    if (actions.includes('updateDraft')) {
        tools.push(new UpdateDraftTool({ accessToken, defaultParams }));
    }
    if (actions.includes('sendDraft')) {
        tools.push(new SendDraftTool({ accessToken, defaultParams }));
    }
    if (actions.includes('deleteDraft')) {
        tools.push(new DeleteDraftTool({ accessToken, defaultParams }));
    }
    // Message tools
    if (actions.includes('listMessages')) {
        tools.push(new ListMessagesTool({ accessToken, defaultParams }));
    }
    if (actions.includes('getMessage')) {
        tools.push(new GetMessageTool({ accessToken, defaultParams }));
    }
    if (actions.includes('sendMessage')) {
        tools.push(new SendMessageTool({ accessToken, defaultParams }));
    }
    if (actions.includes('modifyMessage')) {
        tools.push(new ModifyMessageTool({ accessToken, defaultParams }));
    }
    if (actions.includes('trashMessage')) {
        tools.push(new TrashMessageTool({ accessToken, defaultParams }));
    }
    if (actions.includes('untrashMessage')) {
        tools.push(new UntrashMessageTool({ accessToken, defaultParams }));
    }
    if (actions.includes('deleteMessage')) {
        tools.push(new DeleteMessageTool({ accessToken, defaultParams }));
    }
    // Label tools
    if (actions.includes('listLabels')) {
        tools.push(new ListLabelsTool({ accessToken, defaultParams }));
    }
    if (actions.includes('getLabel')) {
        tools.push(new GetLabelTool({ accessToken, defaultParams }));
    }
    if (actions.includes('createLabel')) {
        tools.push(new CreateLabelTool({ accessToken, defaultParams }));
    }
    if (actions.includes('updateLabel')) {
        tools.push(new UpdateLabelTool({ accessToken, defaultParams }));
    }
    if (actions.includes('deleteLabel')) {
        tools.push(new DeleteLabelTool({ accessToken, defaultParams }));
    }
    // Thread tools
    if (actions.includes('listThreads')) {
        tools.push(new ListThreadsTool({ accessToken, defaultParams }));
    }
    if (actions.includes('getThread')) {
        tools.push(new GetThreadTool({ accessToken, defaultParams }));
    }
    if (actions.includes('modifyThread')) {
        tools.push(new ModifyThreadTool({ accessToken, defaultParams }));
    }
    if (actions.includes('trashThread')) {
        tools.push(new TrashThreadTool({ accessToken, defaultParams }));
    }
    if (actions.includes('untrashThread')) {
        tools.push(new UntrashThreadTool({ accessToken, defaultParams }));
    }
    if (actions.includes('deleteThread')) {
        tools.push(new DeleteThreadTool({ accessToken, defaultParams }));
    }
    return tools;
};
exports.createGmailTools = createGmailTools;
//# sourceMappingURL=core.js.map