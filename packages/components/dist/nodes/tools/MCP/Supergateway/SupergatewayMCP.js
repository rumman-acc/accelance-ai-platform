"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
class Supergateway_MCP {
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
                            description: 'No available actions, please check the arguments again and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'Supergateway MCP';
        this.name = 'supergatewayMCP';
        this.version = 1.0;
        this.type = 'Supergateway MCP Tool';
        this.icon = 'supermachine-logo.png';
        this.category = 'Tools (MCP)';
        this.description = 'Runs MCP stdio-based servers over SSE (Server-Sent Events) or WebSockets (WS)';
        this.documentation = 'https://github.com/supercorp-ai/supergateway';
        this.inputs = [
            {
                label: 'Arguments',
                name: 'arguments',
                type: 'string',
                rows: 4,
                placeholder: '--sse "https://mcp-server-ab71a6b2-cd55-49d0-adba-562bc85956e3.supermachine.app"',
                description: 'Arguments to pass to the supergateway server. Refer to the <a href="https://github.com/supercorp-ai/supergateway/blob/main/README.md" target="_blank">documentation</a> for more information.'
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
    async getTools(nodeData, _) {
        const _args = nodeData.inputs?.arguments;
        const packagePath = (0, utils_1.getNodeModulesPackagePath)('supergateway/dist/index.js');
        const processedArgs = _args
            .trim()
            .split(/\s+/)
            .map((arg) => {
            // Remove surrounding double or single quotes if they exist
            if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
                return arg.slice(1, -1);
            }
            return arg;
        });
        const serverParams = {
            command: 'node',
            args: [packagePath, ...processedArgs]
        };
        if (process.env.CUSTOM_MCP_SECURITY_CHECK !== 'false') {
            try {
                (0, core_1.validateMCPServerConfig)(serverParams);
            }
            catch (error) {
                throw new Error(`Security validation failed: ${error.message}`);
            }
        }
        const toolkit = new core_1.MCPToolkit(serverParams, 'stdio');
        await toolkit.initialize();
        const tools = toolkit.tools ?? [];
        return tools;
    }
}
module.exports = { nodeClass: Supergateway_MCP };
//# sourceMappingURL=SupergatewayMCP.js.map