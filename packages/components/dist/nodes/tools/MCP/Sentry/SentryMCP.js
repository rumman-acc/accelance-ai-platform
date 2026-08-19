"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
class Sentry_MCP {
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
                    return [
                        {
                            label: 'No Available Actions',
                            name: 'error',
                            description: 'No available actions, please check your Sentry Auth Token and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'Sentry MCP';
        this.name = 'sentryMCP';
        this.version = 1.0;
        this.type = 'Sentry MCP Tool';
        this.icon = 'sentry.svg';
        this.category = 'Tools (MCP)';
        this.description = "Sentry's official hosted MCP server for issues, events, and projects";
        this.documentation = 'https://github.com/getsentry/sentry-mcp';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['sentryApi']
        };
        this.inputs = [
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
        const authToken = (0, utils_1.getCredentialParam)('sentryAuthToken', credentialData, nodeData);
        if (!authToken) {
            throw new Error('Missing Sentry Auth Token');
        }
        // Sentry's remote MCP reserves the standard "Bearer" scheme for its own OAuth access
        // tokens; a directly-supplied user auth token must use the "Sentry-Bearer" scheme instead.
        // See: https://github.com/getsentry/sentry-mcp/issues/833
        const serverParams = {
            url: 'https://mcp.sentry.dev/mcp',
            headers: {
                Authorization: `Sentry-Bearer ${authToken}`
            }
        };
        const toolkit = new core_1.MCPToolkit(serverParams, 'http');
        await toolkit.initialize();
        return (toolkit.tools ?? []);
    }
}
module.exports = { nodeClass: Sentry_MCP };
//# sourceMappingURL=SentryMCP.js.map