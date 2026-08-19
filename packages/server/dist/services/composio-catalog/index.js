"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const credentials_1 = __importDefault(require("../credentials"));
const tools_1 = __importDefault(require("../tools"));
// Composio's v2 REST API (what composio-core@0.5.39 -- the version already installed for
// the existing `Composio` node -- targets internally) has been fully retired in production
// (confirmed live: 410 "This endpoint is no longer available. Please upgrade to v3 APIs.").
// This service therefore calls the current v3/v3.1 REST surface directly instead of going
// through composio-core, since a saved Tool's generated `func` runs in a sandboxed VM that
// can't require composio-core anyway (only axios/node-fetch are allowlisted there).
const COMPOSIO_BASE_URL = 'https://backend.composio.dev';
const SAFE_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const mapJsonSchemaTypeToFlatType = (schema) => {
    const type = schema?.type;
    if (type === 'integer' || type === 'number')
        return 'number';
    if (type === 'boolean')
        return 'boolean';
    return 'string';
};
// Sanitizes a JSON-Schema `properties` map into the Tool entity's flat schema format.
// Mirrors OpenAPIToolkit's exportSelectedEndpointsAsTools flattening convention: unsafe/
// duplicate identifiers fall back to paramN, with the real API field name preserved in
// the description so the generated func's request body still uses the correct field.
const buildFlatFieldsFromParameters = (parameters) => {
    const properties = parameters?.properties && typeof parameters.properties === 'object' ? parameters.properties : {};
    const required = Array.isArray(parameters?.required) ? parameters.required : [];
    const usedKeys = new Set();
    let counter = 0;
    return Object.keys(properties).map((rawName) => {
        const propSchema = properties[rawName] || {};
        let key = rawName;
        if (!SAFE_IDENTIFIER.test(key) || usedKeys.has(key)) {
            counter += 1;
            key = `param${counter}`;
        }
        usedKeys.add(key);
        const description = key === rawName ? propSchema.description || rawName : `${propSchema.description || rawName} (API field: ${rawName})`;
        return {
            key,
            property: key,
            description,
            type: mapJsonSchemaTypeToFlatType(propSchema),
            required: required.includes(rawName)
        };
    });
};
const buildComposioFunc = (actionSlug, apiKey, connectedAccountId, fields) => {
    const inputAssignments = fields.map((f) => `    args['${f.property}'] = $${f.property};`).join('\n');
    const connectedAccountLiteral = connectedAccountId ? `'${connectedAccountId}'` : 'undefined';
    return `const fetch = require('node-fetch');
const args = {};
${inputAssignments}
const options = {
    method: 'POST',
    headers: {
        'x-api-key': '${apiKey}',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        connected_account_id: ${connectedAccountLiteral},
        arguments: args
    })
};
const response = await fetch('${COMPOSIO_BASE_URL}/api/v3/tools/execute/${actionSlug}', options);
const responseText = await response.text();
if (!response.ok) {
    throw new Error('Composio API Error ' + response.status + ': ' + responseText);
}
return responseText;`;
};
const getComposioApiKey = async (credentialId, workspaceId) => {
    const credential = await credentials_1.default.getCredentialById(credentialId, workspaceId);
    const apiKey = credential?.plainDataObj?.composioApi;
    if (!apiKey) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, 'Composio API key not found on the given credential');
    }
    return apiKey;
};
const searchActions = async (credentialId, workspaceId, query) => {
    try {
        const apiKey = await getComposioApiKey(credentialId, workspaceId);
        const params = new URLSearchParams();
        if (query)
            params.set('query', query);
        params.set('limit', '30');
        const response = await fetch(`${COMPOSIO_BASE_URL}/api/v3.1/tools?${params.toString()}`, {
            headers: { 'x-api-key': apiKey }
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Composio API Error ${response.status}: ${text}`);
        }
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        return items.map((item) => ({
            name: item.slug,
            displayName: item.name || item.slug,
            description: item.description,
            appName: item.toolkit?.slug,
            logo: item.toolkit?.logo,
            noAuth: item.no_auth === true,
            tags: item.tags || []
        }));
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: composioCatalogService.searchActions - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const listConnections = async (credentialId, workspaceId, appName) => {
    try {
        const apiKey = await getComposioApiKey(credentialId, workspaceId);
        const params = new URLSearchParams({ toolkit_slug: appName.toLowerCase(), status: 'ACTIVE' });
        const response = await fetch(`${COMPOSIO_BASE_URL}/api/v3/connected_accounts?${params.toString()}`, {
            headers: { 'x-api-key': apiKey }
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Composio API Error ${response.status}: ${text}`);
        }
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        return items.map((c) => ({
            id: c.id,
            label: c.userId || c.user_id || c.id,
            createdAt: c.createdAt || c.created_at
        }));
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: composioCatalogService.listConnections - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const importAction = async (credentialId, workspaceId, orgId, actionName, connectedAccountId) => {
    try {
        const apiKey = await getComposioApiKey(credentialId, workspaceId);
        const params = new URLSearchParams({ tool_slugs: actionName, limit: '1' });
        const response = await fetch(`${COMPOSIO_BASE_URL}/api/v3.1/tools?${params.toString()}`, {
            headers: { 'x-api-key': apiKey }
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Composio API Error ${response.status}: ${text}`);
        }
        const data = await response.json();
        const action = Array.isArray(data?.items) ? data.items[0] : undefined;
        if (!action) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Composio action ${actionName} not found`);
        }
        if (action.no_auth !== true && !connectedAccountId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `${action.toolkit?.slug || actionName} requires a connected account. Please select one, or connect it on app.composio.dev first.`);
        }
        const fields = buildFlatFieldsFromParameters(action.input_parameters);
        const func = buildComposioFunc(action.slug, apiKey, connectedAccountId, fields);
        const schema = fields.map((f) => ({
            property: f.property,
            description: f.description,
            type: f.type,
            required: f.required
        }));
        const toolBody = {
            name: action.name || action.slug,
            description: action.description || `Composio action: ${action.slug}`,
            color: '#6366f1',
            iconSrc: action.toolkit?.logo || undefined,
            schema: JSON.stringify(schema),
            func,
            workspaceId
        };
        return await tools_1.default.createTool(toolBody, orgId);
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: composioCatalogService.importAction - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    searchActions,
    listConnections,
    importAction
};
//# sourceMappingURL=index.js.map