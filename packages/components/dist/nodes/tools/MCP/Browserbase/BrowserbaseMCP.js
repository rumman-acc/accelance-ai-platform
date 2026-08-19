"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const core_1 = require("../core");
class Browserbase_MCP {
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
                            description: 'No available actions, please check your Browserbase API Key/Project ID and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'Browserbase MCP';
        this.name = 'browserbaseMCP';
        this.version = 1.0;
        this.type = 'Browserbase MCP Tool';
        this.icon = 'browserbase.svg';
        this.category = 'Tools (MCP)';
        this.description = "Browserbase's official MCP server for cloud browser automation (navigate, act, extract)";
        this.documentation = 'https://docs.browserbase.com/integrations/mcp/configuration';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['browserbaseApi']
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
        const apiKey = (0, utils_1.getCredentialParam)('browserbaseApiKey', credentialData, nodeData);
        const projectId = (0, utils_1.getCredentialParam)('browserbaseProjectId', credentialData, nodeData);
        if (!apiKey || !projectId) {
            throw new Error('Missing Browserbase API Key or Project ID');
        }
        const serverParams = {
            command: 'npx',
            args: ['-y', '@browserbasehq/mcp'],
            env: {
                BROWSERBASE_API_KEY: apiKey,
                BROWSERBASE_PROJECT_ID: projectId
            }
        };
        const toolkit = new core_1.MCPToolkit(serverParams, 'stdio');
        await toolkit.initialize();
        return (toolkit.tools ?? []);
    }
}
module.exports = { nodeClass: Browserbase_MCP };
//# sourceMappingURL=BrowserbaseMCP.js.map