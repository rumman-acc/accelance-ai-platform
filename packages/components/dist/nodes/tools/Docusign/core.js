"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocusignTools = exports.desc = void 0;
const v3_1 = require("zod/v3");
const core_1 = require("../OpenAPIToolkit/core");
const agents_1 = require("../../../src/agents");
const httpSecurity_1 = require("../../../src/httpSecurity");
exports.desc = `Use this when you want to access DocuSign API for sending documents for e-signature and checking envelope status`;
// Define schemas for different DocuSign operations
const CreateEnvelopeSchema = v3_1.z.object({
    emailSubject: v3_1.z.string().describe('Subject line for the envelope email'),
    documentBase64: v3_1.z.string().describe('Base64-encoded document content'),
    documentName: v3_1.z.string().describe('Name of the document'),
    fileExtension: v3_1.z.string().describe('e.g. pdf, docx'),
    signerEmail: v3_1.z.string().describe('Email address of the signer'),
    signerName: v3_1.z.string().describe('Name of the signer')
});
const GetEnvelopeStatusSchema = v3_1.z.object({
    envelopeId: v3_1.z.string().describe('ID of the envelope to check status for')
});
const ListEnvelopesSchema = v3_1.z.object({
    fromDate: v3_1.z.string().describe('ISO date string, e.g. 2026-01-01, to list envelopes created/modified since this date')
});
const VoidEnvelopeSchema = v3_1.z.object({
    envelopeId: v3_1.z.string().describe('ID of the envelope to void'),
    voidedReason: v3_1.z.string().describe('Reason for voiding the envelope')
});
class BaseDocusignTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args);
        this.accountBaseUri = '';
        this.accountId = '';
        this.accessToken = '';
        this.accountBaseUri = args.accountBaseUri ?? '';
        this.accountId = args.accountId ?? '';
        this.accessToken = args.accessToken ?? '';
    }
    async makeDocusignRequest({ endpoint, method = 'GET', body, params }) {
        const baseUrl = `${this.accountBaseUri}/restapi/v2.1/accounts/${this.accountId}`;
        const url = `${baseUrl}/${endpoint}`;
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
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions, 5);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DocuSign API Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.text();
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params);
    }
}
class CreateEnvelopeTool extends BaseDocusignTool {
    constructor(args) {
        const toolInput = {
            name: 'create_envelope',
            description: 'Create and send a DocuSign envelope for e-signature',
            schema: CreateEnvelopeSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        };
        super({
            ...toolInput,
            accountBaseUri: args.accountBaseUri,
            accountId: args.accountId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const envelopeData = {
                emailSubject: params.emailSubject,
                documents: [
                    {
                        documentBase64: params.documentBase64,
                        name: params.documentName,
                        fileExtension: params.fileExtension,
                        documentId: '1'
                    }
                ],
                recipients: {
                    signers: [
                        {
                            email: params.signerEmail,
                            name: params.signerName,
                            recipientId: '1',
                            routingOrder: '1'
                        }
                    ]
                },
                status: 'sent'
            };
            const response = await this.makeDocusignRequest({ endpoint: 'envelopes', method: 'POST', body: envelopeData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error creating envelope: ${error}`, params);
        }
    }
}
class GetEnvelopeStatusTool extends BaseDocusignTool {
    constructor(args) {
        const toolInput = {
            name: 'get_envelope_status',
            description: 'Get the status of a DocuSign envelope',
            schema: GetEnvelopeStatusSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accountBaseUri: args.accountBaseUri,
            accountId: args.accountId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `envelopes/${params.envelopeId}`;
            const response = await this.makeDocusignRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error getting envelope status: ${error}`, params);
        }
    }
}
class ListEnvelopesTool extends BaseDocusignTool {
    constructor(args) {
        const toolInput = {
            name: 'list_envelopes',
            description: 'List DocuSign envelopes created or modified since a given date',
            schema: ListEnvelopesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        };
        super({
            ...toolInput,
            accountBaseUri: args.accountBaseUri,
            accountId: args.accountId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const endpoint = `envelopes?from_date=${params.fromDate}`;
            const response = await this.makeDocusignRequest({ endpoint, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error listing envelopes: ${error}`, params);
        }
    }
}
class VoidEnvelopeTool extends BaseDocusignTool {
    constructor(args) {
        const toolInput = {
            name: 'void_envelope',
            description: 'Void a DocuSign envelope',
            schema: VoidEnvelopeSchema,
            baseUrl: '',
            method: 'PUT',
            headers: {}
        };
        super({
            ...toolInput,
            accountBaseUri: args.accountBaseUri,
            accountId: args.accountId,
            accessToken: args.accessToken,
            maxOutputLength: args.maxOutputLength
        });
        this.defaultParams = args.defaultParams || {};
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams };
        try {
            const voidData = {
                status: 'voided',
                voidedReason: params.voidedReason
            };
            const endpoint = `envelopes/${params.envelopeId}`;
            const response = await this.makeDocusignRequest({ endpoint, method: 'PUT', body: voidData, params });
            return response;
        }
        catch (error) {
            return (0, agents_1.formatToolError)(`Error voiding envelope: ${error}`, params);
        }
    }
}
const createDocusignTools = (args) => {
    const tools = [];
    const actions = args?.actions || [];
    const accountBaseUri = args?.accountBaseUri || '';
    const accountId = args?.accountId || '';
    const accessToken = args?.accessToken || '';
    const maxOutputLength = args?.maxOutputLength || Infinity;
    const defaultParams = args?.defaultParams || {};
    if (actions.includes('create_envelope')) {
        tools.push(new CreateEnvelopeTool({
            accountBaseUri,
            accountId,
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('get_envelope_status')) {
        tools.push(new GetEnvelopeStatusTool({
            accountBaseUri,
            accountId,
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('list_envelopes')) {
        tools.push(new ListEnvelopesTool({
            accountBaseUri,
            accountId,
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    if (actions.includes('void_envelope')) {
        tools.push(new VoidEnvelopeTool({
            accountBaseUri,
            accountId,
            accessToken,
            maxOutputLength,
            defaultParams
        }));
    }
    return tools;
};
exports.createDocusignTools = createDocusignTools;
//# sourceMappingURL=core.js.map