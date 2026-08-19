"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
class SequentialThinking_MCP {
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
                            description: 'No available actions, please refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'Sequential Thinking MCP';
        this.name = 'sequentialThinkingMCP';
        this.version = 1.0;
        this.type = 'Sequential Thinking MCP Tool';
        this.icon = 'sequentialthinking.svg';
        this.category = 'Tools (MCP)';
        this.description =
            'MCP server that provides a tool for dynamic and reflective problem-solving through a structured thinking process';
        this.documentation = 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking';
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
    async getTools(_nodeData, _options) {
        const packagePath = (0, utils_1.getNodeModulesPackagePath)('@modelcontextprotocol/server-sequential-thinking/dist/index.js');
        const serverParams = {
            command: 'node',
            args: [packagePath]
        };
        const toolkit = new core_1.MCPToolkit(serverParams, 'stdio');
        await toolkit.initialize();
        const tools = toolkit.tools ?? [];
        return tools;
    }
}
module.exports = { nodeClass: SequentialThinking_MCP };
//# sourceMappingURL=SequentialThinkingMCP.js.map