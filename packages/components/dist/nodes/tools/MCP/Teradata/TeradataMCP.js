"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
const object_hash_1 = __importDefault(require("object-hash"));
class Teradata_MCP {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            listActions: async (nodeData, options) => {
                try {
                    const toolset = await this.getTools(nodeData, options);
                    toolset.sort((a, b) => a.name.localeCompare(b.name));
                    return toolset.map(({ name, ...rest }) => ({
                        label: name.toUpperCase(),
                        name: name,
                        description: rest.description || name
                    }));
                }
                catch (error) {
                    console.error('Error listing actions:', error);
                    return [
                        {
                            label: 'No Available Actions',
                            name: 'error',
                            description: 'No available actions, please check your MCP server URL and credentials, then refresh.'
                        }
                    ];
                }
            }
        };
        this.label = 'Teradata MCP';
        this.name = 'teradataMCP';
        this.version = 1.0;
        this.type = 'Teradata MCP Tool';
        this.icon = 'teradata.svg';
        this.category = 'Tools (MCP)';
        this.description = 'MCP Server for Teradata (remote HTTP streamable)';
        this.documentation = 'https://github.com/Teradata/teradata-mcp-server';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['teradataTD2Auth', 'teradataBearerToken'],
            description: 'Needed when using Teradata MCP server with authentication'
        };
        this.inputs = [
            {
                label: 'MCP Server URL',
                name: 'mcpUrl',
                type: 'string',
                placeholder: 'http://teradata-mcp-server:8001/mcp',
                description: 'URL of your Teradata MCP server',
                optional: false
            },
            {
                label: 'Bearer Token',
                name: 'bearerToken',
                type: 'string',
                optional: true,
                description: 'Optional to override Default set credentials'
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
                console.error('Error parsing mcp actions:', error);
            }
        }
        return tools.filter((tool) => mcpActions.includes(tool.name));
    }
    async getTools(nodeData, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const mcpUrl = nodeData.inputs?.mcpUrl || 'http://teradata-mcp-server:8001/mcp';
        if (!mcpUrl) {
            throw new Error('Missing MCP Server URL');
        }
        // Determine auth method from credentials
        let serverParams = {
            url: mcpUrl,
            headers: {}
        };
        // Get Bearer token from node input (from agent flow) or credential store
        const bearerToken = nodeData.inputs?.bearerToken || (0, utils_1.getCredentialParam)('token', credentialData, nodeData);
        const username = (0, utils_1.getCredentialParam)('tdUsername', credentialData, nodeData);
        const password = (0, utils_1.getCredentialParam)('tdPassword', credentialData, nodeData);
        if (bearerToken) {
            serverParams.headers['Authorization'] = `Bearer ${bearerToken}`;
        }
        else if (username && password) {
            serverParams.headers['Authorization'] = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
        }
        else {
            throw new Error('Missing credentials: provide Bearer token from flow/credentials OR username/password from credentials');
        }
        const workspaceId = options?.searchOptions?.workspaceId?._value || options?.workspaceId || 'tdws_default';
        let sandbox = {};
        const cacheKey = (0, object_hash_1.default)({ workspaceId, serverParams, sandbox });
        if (options.cachePool) {
            const cachedResult = await options.cachePool.getMCPCache(cacheKey);
            if (cachedResult) {
                if (cachedResult.tools.length > 0) {
                    return cachedResult.tools;
                }
            }
        }
        // Use SSE for remote HTTP MCP servers
        const toolkit = new core_1.MCPToolkit(serverParams, 'sse');
        await toolkit.initialize();
        const tools = toolkit.tools ?? [];
        if (options.cachePool) {
            await options.cachePool.addMCPCache(cacheKey, { toolkit, tools });
        }
        return tools;
    }
}
module.exports = { nodeClass: Teradata_MCP };
//# sourceMappingURL=TeradataMCP.js.map