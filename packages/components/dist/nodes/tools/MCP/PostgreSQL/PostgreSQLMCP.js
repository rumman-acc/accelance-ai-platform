"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
class PostgreSQL_MCP {
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
                            description: 'No available actions, please check your postgres url and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'PostgreSQL MCP';
        this.name = 'postgreSQLMCP';
        this.version = 1.0;
        this.type = 'PostgreSQL MCP Tool';
        this.icon = 'postgres.svg';
        this.category = 'Tools (MCP)';
        this.description = 'MCP server that provides read-only access to PostgreSQL databases';
        this.documentation = 'https://github.com/modelcontextprotocol/servers-archived/tree/main/src/postgres';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['PostgresUrl']
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
        const postgresUrl = (0, utils_1.getCredentialParam)('postgresUrl', credentialData, nodeData);
        if (!postgresUrl) {
            throw new Error('No postgres url provided');
        }
        const packagePath = (0, utils_1.getNodeModulesPackagePath)('@modelcontextprotocol/server-postgres/dist/index.js');
        const serverParams = {
            command: 'node',
            args: [packagePath, postgresUrl]
        };
        const toolkit = new core_1.MCPToolkit(serverParams, 'stdio');
        await toolkit.initialize();
        const tools = toolkit.tools ?? [];
        return tools;
    }
}
module.exports = { nodeClass: PostgreSQL_MCP };
//# sourceMappingURL=PostgreSQLMCP.js.map