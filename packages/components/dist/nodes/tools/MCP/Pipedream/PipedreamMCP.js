"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("@langchain/core/tools");
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
const axios_1 = __importDefault(require("axios"));
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const VAR_PLACEHOLDER_RE = /\{\{\$vars\.([^}]+)\}\}/g;
const PIPEDREAM_CONNECT_URL_PATTERN = /https:\/\/pipedream\.com\/_static\/connect\.html\?[^\s"')]+/;
const tokenCache = new Map();
function extractConnectUrl(text) {
    const match = text.match(PIPEDREAM_CONNECT_URL_PATTERN);
    return match ? match[0] : null;
}
function formatPipedreamResponse(res) {
    const textItems = res.content.filter((c) => c.type === 'text').map((c) => c.text);
    const text = textItems.join('\n');
    const connectUrl = extractConnectUrl(text);
    if (connectUrl) {
        return `ACTION_REQUIRED: Account connection needed.

The user must connect their account before this action can be executed.
Direct them to open the following URL in their browser:

[Connect URL](${connectUrl})  

Once the user has connected their account, retry the original request.`;
    }
    if (res.isError) {
        return `ERROR: ${text}`;
    }
    return text;
}
async function createPipedreamTool(toolkit, name, description, argsSchema) {
    return (0, tools_1.tool)(async (input) => {
        const client = await toolkit.createClient();
        try {
            const req = {
                method: 'tools/call',
                params: { name, arguments: input }
            };
            const res = await client.request(req, types_js_1.CallToolResultSchema);
            return formatPipedreamResponse(res);
        }
        finally {
            await client.close();
        }
    }, { name, description, schema: argsSchema });
}
class Pipedream_MCP {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            listActions: async (nodeData, options) => {
                try {
                    const appSlug = nodeData.inputs?.appSlug;
                    const externalUserId = nodeData.inputs?.externalUserId;
                    if (!appSlug || !externalUserId) {
                        return [
                            {
                                label: 'Please fill in App Slug and User ID first',
                                name: 'placeholder',
                                description: 'Configure the required fields above, then refresh'
                            }
                        ];
                    }
                    const toolset = await this.getTools(nodeData, options, true);
                    toolset.sort((a, b) => a.name.localeCompare(b.name));
                    return toolset.map(({ name, ...rest }) => ({
                        label: name.toUpperCase(),
                        name: name,
                        description: rest.description || name
                    }));
                }
                catch (error) {
                    console.error('Error listing actions:', error instanceof Error ? error.message : String(error));
                    return [
                        {
                            label: 'No Available Actions',
                            name: 'error',
                            description: error.message || 'Error loading actions'
                        }
                    ];
                }
            }
        };
        this.label = 'Pipedream MCP';
        this.name = 'pipedreamMCP';
        this.version = 1.0;
        this.type = 'Pipedream MCP Tool';
        this.icon = 'pipedream.svg';
        this.category = 'Tools (MCP)';
        this.description = 'MCP Server for Pipedream. For critical actions, ensure "Require Human Input" is enabled on the Agent node.';
        this.documentation = 'https://pipedream.com/docs/connect/mcp/developers';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['pipedreamOAuthApi']
        };
        this.inputs = [
            {
                label: 'Environment',
                name: 'environment',
                type: 'options',
                options: [
                    {
                        label: 'Development',
                        name: 'development'
                    },
                    {
                        label: 'Production',
                        name: 'production'
                    }
                ],
                default: 'development'
            },
            {
                label: 'App Slug',
                name: 'appSlug',
                type: 'string',
                description: 'The unique app identifier (name slug) for a Pipedream app (e.g. <code>slack</code>, <code>gmail</code>, <code>notion</code>, <code>linear</code>). Browse all available apps and their slugs at <a target="_blank" href="https://mcp.pipedream.com">mcp.pipedream.com</a>. The slug is the lowercase name shown in the app URL on Pipedream (e.g. pipedream.com/apps/<b>slack</b>). You can specify multiple apps by providing comma-separated slugs (e.g. <code>slack,notion</code>).'
            },
            {
                label: 'User ID',
                name: 'externalUserId',
                type: 'string',
                description: 'A unique identifier for your end user (e.g. email or user ID from your system). Supports Flowise variables (e.g. <code>{{$vars.user_email}}</code>) and flow variables (e.g. <code>{{$flow.sessionId}}</code>).',
                acceptVariable: true,
                placeholder: '{{$vars.user_email}}'
            },
            {
                label: 'Tool Mode',
                name: 'toolMode',
                type: 'options',
                options: [
                    {
                        label: 'Tools only',
                        name: 'tools-only'
                    }
                ],
                default: 'tools-only'
            },
            {
                label: 'Available Actions',
                name: 'mcpActions',
                type: 'asyncMultiOptions',
                loadMethod: 'listActions',
                refresh: true
            }
        ];
        this.baseClasses = ['Tool'];
    }
    async init(nodeData, _, options) {
        const tools = await this.getTools(nodeData, options);
        const _mcpActions = nodeData.inputs?.mcpActions;
        let mcpActions = [];
        if (_mcpActions) {
            try {
                mcpActions = typeof _mcpActions === 'string' ? JSON.parse(_mcpActions) : _mcpActions;
            }
            catch (error) {
                console.error('Error parsing mcp actions:', error instanceof Error ? error.message : String(error));
            }
        }
        return tools.filter((tool) => mcpActions.includes(tool.name));
    }
    async fetchAccessToken(clientId, clientSecret, scope) {
        const tokenCacheKey = `${clientId}:${scope ?? '*'}`;
        const cached = tokenCache.get(tokenCacheKey);
        if (cached && cached.expiresAt > Date.now() + 60000) {
            return cached.token;
        }
        try {
            const body = {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            };
            if (scope) {
                body.scope = scope;
            }
            const response = await axios_1.default.post('https://api.pipedream.com/v1/oauth/token', body, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const accessToken = response.data?.access_token;
            if (!accessToken) {
                throw new Error('Failed to retrieve access token: Response missing access_token field');
            }
            const expiresIn = response.data?.expires_in ?? 3600;
            tokenCache.set(tokenCacheKey, {
                token: accessToken,
                expiresAt: Date.now() + expiresIn * 1000
            });
            return accessToken;
        }
        catch (error) {
            if (error.response?.status === 401) {
                tokenCache.delete(tokenCacheKey);
                throw new Error('Invalid Pipedream credentials. Please verify your Client ID and Client Secret.');
            }
            const message = error.message ?? 'Unknown error';
            const code = error.code ?? error.response?.status ?? 'UNKNOWN';
            throw new Error(`Pipedream OAuth token request failed [${code}]: ${message}`);
        }
    }
    async resolveVarsInString(value, nodeData, options) {
        if (!value.includes('{{$vars.'))
            return value;
        const workspaceId = options?.searchOptions?.workspaceId?._value || options?.workspaceId;
        if (!workspaceId)
            return value;
        const appDataSource = options.appDataSource;
        const databaseEntities = options.databaseEntities;
        const optionsWithWorkspaceId = options.workspaceId ? options : { ...options, workspaceId };
        const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, optionsWithWorkspaceId);
        const vars = (0, utils_1.prepareSandboxVars)(variables);
        return value.replace(VAR_PLACEHOLDER_RE, (match, varName) => {
            return vars[varName] != null ? String(vars[varName]) : match;
        });
    }
    async getTools(nodeData, options, isLoadMethod = false) {
        const appSlug = nodeData.inputs?.appSlug;
        if (!appSlug) {
            throw new Error('Pipedream app slug is required');
        }
        const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{0,98}[a-z0-9])?(?:,\s*[a-z0-9](?:[a-z0-9_-]{0,98}[a-z0-9])?)*$/;
        if (!SLUG_PATTERN.test(appSlug)) {
            throw new Error('Invalid app slug format. Must be lowercase letters, digits, hyphens and underscores only.');
        }
        let externalUserId = nodeData.inputs?.externalUserId;
        externalUserId = await this.resolveVarsInString(externalUserId, nodeData, options);
        if (externalUserId.includes('{{')) {
            if (!isLoadMethod) {
                throw new Error('Variables in User ID are not resolved. ' +
                    '{{$vars.*}} requires a matching workspace variable. ' +
                    '{{$flow.*}} variables (e.g. sessionId) are only available at runtime, not when refreshing actions.');
            }
            // For loadMethods context, use a sanitized fallback so tool listing still works.
            // The actual externalUserId will be resolved at runtime.
            externalUserId = 'flowise_preview_user';
        }
        externalUserId = externalUserId.replace(/<[^>]*>/g, '').trim();
        if (!externalUserId) {
            throw new Error('Pipedream user ID is required');
        }
        const SAFE_USER_ID = /^[a-zA-Z0-9._@+-]{1,250}$/;
        if (!SAFE_USER_ID.test(externalUserId.trim())) {
            throw new Error('User ID contains invalid characters. Allowed: letters, digits, . _ @ + -');
        }
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const projectId = (0, utils_1.getCredentialParam)('projectId', credentialData, nodeData);
        const oauthScopes = (0, utils_1.getCredentialParam)('oauthScopes', credentialData, nodeData);
        if (!projectId) {
            throw new Error('Pipedream Project ID is required in credentials');
        }
        const clientId = (0, utils_1.getCredentialParam)('clientId', credentialData, nodeData);
        const clientSecret = (0, utils_1.getCredentialParam)('clientSecret', credentialData, nodeData);
        if (!clientId || !clientSecret) {
            throw new Error('Pipedream Client ID and Client Secret are required in credentials');
        }
        const accessToken = await this.fetchAccessToken(clientId, clientSecret, oauthScopes);
        const environment = nodeData.inputs?.environment || 'development';
        const toolMode = nodeData.inputs?.toolMode || 'tools-only';
        const serverParams = {
            url: 'https://remote.mcp.pipedream.net',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'x-pd-project-id': projectId,
                'x-pd-environment': environment,
                'x-pd-external-user-id': externalUserId,
                'x-pd-app-slug': appSlug,
                'x-pd-tool-mode': toolMode
            }
        };
        try {
            const toolkit = new core_1.MCPToolkit(serverParams, 'sse');
            await toolkit.initialize();
            const rawTools = toolkit._tools?.tools ?? [];
            if (rawTools.length === 0) {
                throw new Error(`No tools available for the Pipedream app slug "${appSlug}". Please check your configuration.`);
            }
            const toolPromises = rawTools.map((t) => createPipedreamTool(toolkit, t.name, t.description || t.name, t.inputSchema ?? { type: 'object', properties: {} }));
            const settled = await Promise.allSettled(toolPromises);
            const tools = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
            if (tools.length === 0) {
                throw new Error(`No tools available for the Pipedream app slug "${appSlug}". Please check your configuration.`);
            }
            return tools;
        }
        catch (error) {
            if (error.message?.includes('404')) {
                throw new Error(`Pipedream app slug "${appSlug}" not found. Please verify the slug on mcp.pipedream.com.`);
            }
            if (error.message?.includes('401')) {
                throw new Error('Invalid Pipedream credentials. Please verify your Client ID and Client Secret.');
            }
            if (error.message?.includes('timeout') || error.message?.includes('ECONNABORTED')) {
                throw new Error('Connection to Pipedream MCP server timed out. Please check your network connectivity.');
            }
            if (error.message?.includes('ECONNREFUSED')) {
                throw new Error('Connection refused by Pipedream MCP server. The service may be temporarily unavailable.');
            }
            throw new Error(`Pipedream MCP error: ${error.message ?? 'Unknown error'}`);
        }
    }
}
module.exports = { nodeClass: Pipedream_MCP };
//# sourceMappingURL=PipedreamMCP.js.map