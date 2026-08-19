"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
class BrowserlessMCP {
    constructor() {
        this.loadMethods = {
            listActions: async (nodeData, options) => {
                try {
                    const toolset = await this.getTools(nodeData, options ?? {});
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
                            description: 'No available actions, please check your API token and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'Browserless MCP';
        this.name = 'browserlessMCP';
        this.version = 1.0;
        this.type = 'Browserless MCP Tool';
        this.icon = 'browserless.svg';
        this.category = 'Tools (MCP)';
        this.description = 'MCP Server for Browserless - scrape pages, take screenshots, generate PDFs, and more';
        this.documentation = 'https://docs.browserless.io/mcp/browserless-mcp-server';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['browserlessApi']
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
        const apiToken = (0, utils_1.getCredentialParam)('browserlessApiToken', credentialData, nodeData);
        if (!apiToken) {
            throw new Error('Missing Browserless API Token');
        }
        const serverParams = {
            url: 'https://mcp.browserless.io/mcp',
            headers: {
                Authorization: `Bearer ${apiToken}`
            }
        };
        const toolkit = new core_1.MCPToolkit(serverParams, 'sse');
        await toolkit.initialize();
        const tools = toolkit.tools ?? [];
        return tools;
    }
}
module.exports = { nodeClass: BrowserlessMCP };
//# sourceMappingURL=BrowserlessMCP.js.map