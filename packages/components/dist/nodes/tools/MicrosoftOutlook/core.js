"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOutlookTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const node_fetch_1 = __importDefault(require("node-fetch"));
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
exports.desc = `Use this when you want to access Microsoft Outlook API for managing calendars, events, and messages`;
// Define schemas for different Outlook operations
// Calendar Schemas
const ListCalendarsSchema = v3_1.z.object({
    maxResults: v3_1.z.number().optional().default(50).describe('Maximum number of calendars to return')
});
const GetCalendarSchema = v3_1.z.object({
    calendarId: v3_1.z.string().describe('ID of the calendar to retrieve')
});
const CreateCalendarSchema = v3_1.z.object({
    calendarName: v3_1.z.string().describe('Name of the calendar')
});
const UpdateCalendarSchema = v3_1.z.object({
    calendarId: v3_1.z.string().describe('ID of the calendar to update'),
    calendarName: v3_1.z.string().describe('New name of the calendar')
});
const DeleteCalendarSchema = v3_1.z.object({
    calendarId: v3_1.z.string().describe('ID of the calendar to delete')
});
const ListEventsSchema = v3_1.z.object({
    calendarId: v3_1.z.string().optional().describe('ID of the calendar (empty for primary calendar)'),
    maxResults: v3_1.z.number().optional().default(50).describe('Maximum number of events to return'),
    startDateTime: v3_1.z.string().optional().describe('Start date time filter in ISO format'),
    endDateTime: v3_1.z.string().optional().describe('End date time filter in ISO format')
});
const GetEventSchema = v3_1.z.object({
    eventId: v3_1.z.string().describe('ID of the event to retrieve')
});
const CreateEventSchema = v3_1.z.object({
    subject: v3_1.z.string().describe('Subject/title of the event'),
    body: v3_1.z.string().optional().describe('Body/description of the event'),
    startDateTime: v3_1.z.string().describe('Start date and time in ISO format'),
    endDateTime: v3_1.z.string().describe('End date and time in ISO format'),
    timeZone: v3_1.z.string().optional().default('UTC').describe('Time zone for the event'),
    location: v3_1.z.string().optional().describe('Location of the event'),
    attendees: v3_1.z.string().optional().describe('Comma-separated list of attendee email addresses')
});
const UpdateEventSchema = v3_1.z.object({
    eventId: v3_1.z.string().describe('ID of the event to update'),
    subject: v3_1.z.string().optional().describe('New subject/title of the event')
});
const DeleteEventSchema = v3_1.z.object({
    eventId: v3_1.z.string().describe('ID of the event to delete')
});
// Message Schemas
const ListMessagesSchema = v3_1.z.object({
    maxResults: v3_1.z.number().optional().default(50).describe('Maximum number of messages to return'),
    filter: v3_1.z.string().optional().describe('Filter query (e.g., "isRead eq false")')
});
const GetMessageSchema = v3_1.z.object({
    messageId: v3_1.z.string().describe('ID of the message to retrieve')
});
const CreateDraftMessageSchema = v3_1.z.object({
    to: v3_1.z.string().describe('Recipient email address(es), comma-separated'),
    subject: v3_1.z.string().optional().describe('Subject of the message'),
    body: v3_1.z.string().optional().describe('Body content of the message'),
    cc: v3_1.z.string().optional().describe('CC email address(es), comma-separated'),
    bcc: v3_1.z.string().optional().describe('BCC email address(es), comma-separated')
});
const SendMessageSchema = v3_1.z.object({
    to: v3_1.z.string().describe('Recipient email address(es), comma-separated'),
    subject: v3_1.z.string().optional().describe('Subject of the message'),
    body: v3_1.z.string().optional().describe('Body content of the message')
});
const UpdateMessageSchema = v3_1.z.object({
    messageId: v3_1.z.string().describe('ID of the message to update'),
    isRead: v3_1.z.boolean().optional().describe('Mark message as read/unread')
});
const DeleteMessageSchema = v3_1.z.object({
    messageId: v3_1.z.string().describe('ID of the message to delete')
});
const CopyMessageSchema = v3_1.z.object({
    messageId: v3_1.z.string().describe('ID of the message to copy'),
    destinationFolderId: v3_1.z.string().describe('ID of the destination folder')
});
const MoveMessageSchema = v3_1.z.object({
    messageId: v3_1.z.string().describe('ID of the message to move'),
    destinationFolderId: v3_1.z.string().describe('ID of the destination folder')
});
const ReplyMessageSchema = v3_1.z.object({
    messageId: v3_1.z.string().describe('ID of the message to reply to'),
    replyBody: v3_1.z.string().describe('Reply message body')
});
const ForwardMessageSchema = v3_1.z.object({
    messageId: v3_1.z.string().describe('ID of the message to forward'),
    forwardTo: v3_1.z.string().describe('Email address(es) to forward to, comma-separated'),
    forwardComment: v3_1.z.string().optional().describe('Additional comment to include with forward')
});
class BaseOutlookTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.accessToken = '';
        this.accessToken = args.accessToken ?? '';
    }
    async makeGraphRequest(url, method = 'GET', body, params) {
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
            throw new Error(`Graph API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
    parseEmailAddresses(emailString) {
        return emailString.split(',').map((email) => ({
            emailAddress: {
                address: email.trim(),
                name: email.trim()
            }
        }));
    }
}
// Calendar Tools
class ListCalendarsTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'list_calendars',
            description: 'List calendars in Microsoft Outlook',
            schema: ListCalendarsSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/calendars',
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
            queryParams.append('$top', params.maxResults.toString());
        const url = `https://graph.microsoft.com/v1.0/me/calendars?${queryParams.toString()}`;
        try {
            const response = await this.makeGraphRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing calendars: ${error}`, {});
        }
    }
}
class GetCalendarTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'get_calendar',
            description: 'Get a specific calendar by ID from Microsoft Outlook',
            schema: GetCalendarSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/calendars',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const url = `https://graph.microsoft.com/v1.0/me/calendars/${params.calendarId}`;
        try {
            const response = await this.makeGraphRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting calendar: ${error}`, params);
        }
    }
}
class CreateCalendarTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'create_calendar',
            description: 'Create a new calendar in Microsoft Outlook',
            schema: CreateCalendarSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/calendars',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const calendarData = {
                name: params.calendarName
            };
            const url = 'https://graph.microsoft.com/v1.0/me/calendars';
            const response = await this.makeGraphRequest(url, 'POST', calendarData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating calendar: ${error}`, params);
        }
    }
}
class UpdateCalendarTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'update_calendar',
            description: 'Update a calendar in Microsoft Outlook',
            schema: UpdateCalendarSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/calendars',
            method: 'PATCH',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const calendarData = {
                name: params.calendarName
            };
            const url = `https://graph.microsoft.com/v1.0/me/calendars/${params.calendarId}`;
            const response = await this.makeGraphRequest(url, 'PATCH', calendarData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating calendar: ${error}`, params);
        }
    }
}
class DeleteCalendarTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_calendar',
            description: 'Delete a calendar from Microsoft Outlook',
            schema: DeleteCalendarSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/calendars',
            method: 'DELETE',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const url = `https://graph.microsoft.com/v1.0/me/calendars/${params.calendarId}`;
        try {
            await this.makeGraphRequest(url, 'DELETE', undefined, params);
            return `Calendar ${params.calendarId} deleted successfully`;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting calendar: ${error}`, params);
        }
    }
}
class ListEventsTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'list_events',
            description: 'List events from Microsoft Outlook calendar',
            schema: ListEventsSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/events',
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
            queryParams.append('$top', params.maxResults.toString());
        if (params.startDateTime)
            queryParams.append('$filter', `start/dateTime ge '${params.startDateTime}'`);
        if (params.endDateTime) {
            const existingFilter = queryParams.get('$filter');
            const endFilter = `end/dateTime le '${params.endDateTime}'`;
            if (existingFilter) {
                queryParams.set('$filter', `${existingFilter} and ${endFilter}`);
            }
            else {
                queryParams.append('$filter', endFilter);
            }
        }
        const baseUrl = params.calendarId
            ? `https://graph.microsoft.com/v1.0/me/calendars/${params.calendarId}/events`
            : 'https://graph.microsoft.com/v1.0/me/events';
        const url = `${baseUrl}?${queryParams.toString()}`;
        try {
            const response = await this.makeGraphRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing events: ${error}`, params);
        }
    }
}
class GetEventTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'get_event',
            description: 'Get a specific event by ID from Microsoft Outlook',
            schema: GetEventSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/events',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const url = `https://graph.microsoft.com/v1.0/me/events/${params.eventId}`;
        try {
            const response = await this.makeGraphRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting event: ${error}`, params);
        }
    }
}
class CreateEventTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'create_event',
            description: 'Create a new event in Microsoft Outlook calendar',
            schema: CreateEventSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/events',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const eventData = {
                subject: params.subject,
                body: {
                    contentType: 'HTML',
                    content: params.body || ''
                },
                start: {
                    dateTime: params.startDateTime,
                    timeZone: params.timeZone || 'UTC'
                },
                end: {
                    dateTime: params.endDateTime,
                    timeZone: params.timeZone || 'UTC'
                },
                location: params.location
                    ? {
                        displayName: params.location
                    }
                    : undefined,
                attendees: params.attendees ? this.parseEmailAddresses(params.attendees) : []
            };
            const url = 'https://graph.microsoft.com/v1.0/me/events';
            const response = await this.makeGraphRequest(url, 'POST', eventData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating event: ${error}`, params);
        }
    }
}
class UpdateEventTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'update_event',
            description: 'Update an event in Microsoft Outlook calendar',
            schema: UpdateEventSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/events',
            method: 'PATCH',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const eventData = {};
            if (params.subject)
                eventData.subject = params.subject;
            const url = `https://graph.microsoft.com/v1.0/me/events/${params.eventId}`;
            const response = await this.makeGraphRequest(url, 'PATCH', eventData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating event: ${error}`, params);
        }
    }
}
class DeleteEventTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_event',
            description: 'Delete an event from Microsoft Outlook calendar',
            schema: DeleteEventSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/events',
            method: 'DELETE',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const url = `https://graph.microsoft.com/v1.0/me/events/${params.eventId}`;
        try {
            await this.makeGraphRequest(url, 'DELETE', undefined, params);
            return `Event ${params.eventId} deleted successfully`;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting event: ${error}`, params);
        }
    }
}
// Message Tools
class ListMessagesTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'list_messages',
            description: 'List messages from Microsoft Outlook mailbox',
            schema: ListMessagesSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
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
            queryParams.append('$top', params.maxResults.toString());
        if (params.filter)
            queryParams.append('$filter', params.filter);
        const url = `https://graph.microsoft.com/v1.0/me/messages?${queryParams.toString()}`;
        try {
            const response = await this.makeGraphRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing messages: ${error}`, params);
        }
    }
}
class GetMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'get_message',
            description: 'Get a specific message by ID from Microsoft Outlook',
            schema: GetMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
            method: 'GET',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const url = `https://graph.microsoft.com/v1.0/me/messages/${params.messageId}`;
        try {
            const response = await this.makeGraphRequest(url, 'GET', undefined, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting message: ${error}`, params);
        }
    }
}
class CreateDraftMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'create_draft_message',
            description: 'Create a draft message in Microsoft Outlook',
            schema: CreateDraftMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const messageData = {
                subject: params.subject || '',
                body: {
                    contentType: 'HTML',
                    content: params.body || ''
                },
                toRecipients: this.parseEmailAddresses(params.to),
                ccRecipients: params.cc ? this.parseEmailAddresses(params.cc) : [],
                bccRecipients: params.bcc ? this.parseEmailAddresses(params.bcc) : []
            };
            const url = 'https://graph.microsoft.com/v1.0/me/messages';
            const response = await this.makeGraphRequest(url, 'POST', messageData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating draft message: ${error}`, params);
        }
    }
}
class SendMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'send_message',
            description: 'Send a message via Microsoft Outlook',
            schema: SendMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/sendMail',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const messageData = {
                message: {
                    subject: params.subject || '',
                    body: {
                        contentType: 'HTML',
                        content: params.body || ''
                    },
                    toRecipients: this.parseEmailAddresses(params.to)
                },
                saveToSentItems: true
            };
            const url = 'https://graph.microsoft.com/v1.0/me/sendMail';
            await this.makeGraphRequest(url, 'POST', messageData, params);
            return 'Message sent successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error sending message: ${error}`, params);
        }
    }
}
class UpdateMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'update_message',
            description: 'Update a message in Microsoft Outlook',
            schema: UpdateMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
            method: 'PATCH',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const messageData = {};
            if (params.isRead !== undefined)
                messageData.isRead = params.isRead;
            const url = `https://graph.microsoft.com/v1.0/me/messages/${params.messageId}`;
            const response = await this.makeGraphRequest(url, 'PATCH', messageData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error updating message: ${error}`, params);
        }
    }
}
class DeleteMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'delete_message',
            description: 'Delete a message from Microsoft Outlook',
            schema: DeleteMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
            method: 'DELETE',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        const url = `https://graph.microsoft.com/v1.0/me/messages/${params.messageId}`;
        try {
            await this.makeGraphRequest(url, 'DELETE', undefined, params);
            return `Message ${params.messageId} deleted successfully`;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error deleting message: ${error}`, params);
        }
    }
}
class CopyMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'copy_message',
            description: 'Copy a message to another folder in Microsoft Outlook',
            schema: CopyMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const copyData = {
                destinationId: params.destinationFolderId
            };
            const url = `https://graph.microsoft.com/v1.0/me/messages/${params.messageId}/copy`;
            const response = await this.makeGraphRequest(url, 'POST', copyData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error copying message: ${error}`, params);
        }
    }
}
class MoveMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'move_message',
            description: 'Move a message to another folder in Microsoft Outlook',
            schema: MoveMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const moveData = {
                destinationId: params.destinationFolderId
            };
            const url = `https://graph.microsoft.com/v1.0/me/messages/${params.messageId}/move`;
            const response = await this.makeGraphRequest(url, 'POST', moveData, params);
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error moving message: ${error}`, params);
        }
    }
}
class ReplyMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'reply_message',
            description: 'Reply to a message in Microsoft Outlook',
            schema: ReplyMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const replyData = {
                comment: params.replyBody
            };
            const url = `https://graph.microsoft.com/v1.0/me/messages/${params.messageId}/reply`;
            await this.makeGraphRequest(url, 'POST', replyData, params);
            return 'Reply sent successfully';
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error replying to message: ${error}`, params);
        }
    }
}
class ForwardMessageTool extends BaseOutlookTool {
    constructor(args) {
        const toolInput = {
            name: 'forward_message',
            description: 'Forward a message in Microsoft Outlook',
            schema: ForwardMessageSchema,
            baseUrl: 'https://graph.microsoft.com/v1.0/me/messages',
            method: 'POST',
            headers: {}
        };
        super({ ...toolInput, accessToken: args.accessToken });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const forwardData = {
                toRecipients: this.parseEmailAddresses(params.forwardTo),
                comment: params.forwardComment || ''
            };
            const url = `https://graph.microsoft.com/v1.0/me/messages/${params.messageId}/forward`;
            await this.makeGraphRequest(url, 'POST', forwardData, params);
            return 'Message forwarded successfully';
        }
        catch (error) {
            return `Error forwarding message: ${error}`;
        }
    }
}
const createOutlookTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const accessToken = args?.accessToken || '';
    const defaultParams = args?.defaultParams || {};
    // Calendar tools
    if (actions.includes('listCalendars')) {
        const listTool = new ListCalendarsTool({ accessToken, defaultParams });
        tools.push(listTool);
    }
    if (actions.includes('getCalendar')) {
        const getTool = new GetCalendarTool({ accessToken, defaultParams });
        tools.push(getTool);
    }
    if (actions.includes('createCalendar')) {
        const createTool = new CreateCalendarTool({ accessToken, defaultParams });
        tools.push(createTool);
    }
    if (actions.includes('updateCalendar')) {
        const updateTool = new UpdateCalendarTool({ accessToken, defaultParams });
        tools.push(updateTool);
    }
    if (actions.includes('deleteCalendar')) {
        const deleteTool = new DeleteCalendarTool({ accessToken, defaultParams });
        tools.push(deleteTool);
    }
    if (actions.includes('listEvents')) {
        const listTool = new ListEventsTool({ accessToken, defaultParams });
        tools.push(listTool);
    }
    if (actions.includes('getEvent')) {
        const getTool = new GetEventTool({ accessToken, defaultParams });
        tools.push(getTool);
    }
    if (actions.includes('createEvent')) {
        const createTool = new CreateEventTool({ accessToken, defaultParams });
        tools.push(createTool);
    }
    if (actions.includes('updateEvent')) {
        const updateTool = new UpdateEventTool({ accessToken, defaultParams });
        tools.push(updateTool);
    }
    if (actions.includes('deleteEvent')) {
        const deleteTool = new DeleteEventTool({ accessToken, defaultParams });
        tools.push(deleteTool);
    }
    // Message tools
    if (actions.includes('listMessages')) {
        const listTool = new ListMessagesTool({ accessToken, defaultParams });
        tools.push(listTool);
    }
    if (actions.includes('getMessage')) {
        const getTool = new GetMessageTool({ accessToken, defaultParams });
        tools.push(getTool);
    }
    if (actions.includes('createDraftMessage')) {
        const createTool = new CreateDraftMessageTool({ accessToken, defaultParams });
        tools.push(createTool);
    }
    if (actions.includes('sendMessage')) {
        const sendTool = new SendMessageTool({ accessToken, defaultParams });
        tools.push(sendTool);
    }
    if (actions.includes('updateMessage')) {
        const updateTool = new UpdateMessageTool({ accessToken, defaultParams });
        tools.push(updateTool);
    }
    if (actions.includes('deleteMessage')) {
        const deleteTool = new DeleteMessageTool({ accessToken, defaultParams });
        tools.push(deleteTool);
    }
    if (actions.includes('copyMessage')) {
        const copyTool = new CopyMessageTool({ accessToken, defaultParams });
        tools.push(copyTool);
    }
    if (actions.includes('moveMessage')) {
        const moveTool = new MoveMessageTool({ accessToken, defaultParams });
        tools.push(moveTool);
    }
    if (actions.includes('replyMessage')) {
        const replyTool = new ReplyMessageTool({ accessToken, defaultParams });
        tools.push(replyTool);
    }
    if (actions.includes('forwardMessage')) {
        const forwardTool = new ForwardMessageTool({ accessToken, defaultParams });
        tools.push(forwardTool);
    }
    return tools;
};
exports.createOutlookTools = createOutlookTools;
//# sourceMappingURL=core.js.map