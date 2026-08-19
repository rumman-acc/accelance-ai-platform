"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
class Linear_MCP {
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
                            description: 'No available actions, please check your Linear API Key and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'Linear MCP';
        this.name = 'linearMCP';
        this.version = 1.0;
        this.type = 'Linear MCP Tool';
        this.icon = 'linear.svg';
        this.category = 'Tools (MCP)';
        this.description = "Linear's official hosted MCP server for issues, projects, and cycles";
        this.documentation = 'https://linear.app/docs/mcp';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['linearApi']
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
        const apiKey = (0, utils_1.getCredentialParam)('linearApiKey', credentialData, nodeData);
        if (!apiKey) {
            throw new Error('Missing Linear API Key');
        }
        const serverParams = {
            url: 'https://mcp.linear.app/mcp',
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        };
        const toolkit = new core_1.MCPToolkit(serverParams, 'http');
        await toolkit.initialize();
        return (toolkit.tools ?? []);
    }
}
module.exports = { nodeClass: Linear_MCP };
//# sourceMappingURL=LinearMCP.js.map