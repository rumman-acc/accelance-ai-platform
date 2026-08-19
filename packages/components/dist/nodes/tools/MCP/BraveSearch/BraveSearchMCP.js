"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
class BraveSearch_MCP {
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
                            description: 'No available actions, please check your API key and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'Brave Search MCP';
        this.name = 'braveSearchMCP';
        this.version = 1.0;
        this.type = 'BraveSearch MCP Tool';
        this.icon = 'brave.svg';
        this.category = 'Tools (MCP)';
        this.description = 'MCP server that integrates the Brave Search API - a real-time API to access web search capabilities';
        this.documentation = 'https://github.com/brave/brave-search-mcp-server';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['braveSearchApi']
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
        const braveApiKey = (0, utils_1.getCredentialParam)('braveApiKey', credentialData, nodeData);
        const packagePath = (0, utils_1.getNodeModulesPackagePath)('@brave/brave-search-mcp-server/dist/index.js');
        const serverParams = {
            command: 'node',
            args: [packagePath],
            env: {
                BRAVE_API_KEY: braveApiKey
            }
        };
        const toolkit = new core_1.MCPToolkit(serverParams, 'stdio');
        await toolkit.initialize();
        const tools = toolkit.tools ?? [];
        return tools;
    }
}
module.exports = { nodeClass: BraveSearch_MCP };
//# sourceMappingURL=BraveSearchMCP.js.map