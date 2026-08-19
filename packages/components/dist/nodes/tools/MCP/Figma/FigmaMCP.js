'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../../src/utils')
const core_1 = require('../core')
class Figma_MCP {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            listActions: async (nodeData, options) => {
                try {
                    const toolset = await this.getTools(nodeData, options)
                    toolset.sort((a, b) => a.name.localeCompare(b.name))
                    return toolset.map(({ name, ...rest }) => ({
                        label: name.toUpperCase(),
                        name: name,
                        description: rest.description || name
                    }))
                } catch (error) {
                    return [
                        {
                            label: 'No Available Actions',
                            name: 'error',
                            description: 'No available actions, please check your Figma OAuth2 connection and refresh'
                        }
                    ]
                }
            }
        }
        this.label = 'Figma MCP'
        this.name = 'figmaMCP'
        this.version = 1.0
        this.type = 'Figma MCP Tool'
        this.icon = 'figma.svg'
        this.category = 'Tools (MCP)'
        this.description = "Figma's official hosted MCP server for reading files, frames, and components"
        this.documentation = 'https://developers.figma.com/docs/figma-mcp-server/'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['figmaOAuth2']
        }
        this.inputs = [
            {
                label: 'Available Actions',
                name: 'mcpActions',
                type: 'asyncMultiOptions',
                loadMethod: 'listActions',
                refresh: true
            }
        ]
        this.baseClasses = ['Tool']
    }
    async init(nodeData, _, options) {
        const tools = await this.getTools(nodeData, options)
        const _mcpActions = nodeData.inputs?.mcpActions
        let mcpActions = []
        if (_mcpActions) {
            try {
                mcpActions = typeof _mcpActions === 'string' ? JSON.parse(_mcpActions) : _mcpActions
            } catch (error) {
                console.error('Error parsing mcp actions:', error)
            }
        }
        return tools.filter((tool) => mcpActions.includes(tool.name))
    }
    async getTools(nodeData, options) {
        let credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        credentialData = await (0, utils_1.refreshOAuth2Token)(nodeData.credential ?? '', credentialData, options)
        const accessToken = (0, utils_1.getCredentialParam)('access_token', credentialData, nodeData)
        if (!accessToken) {
            throw new Error('No access token found in credential')
        }
        const serverParams = {
            url: 'https://mcp.figma.com/mcp',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
        const toolkit = new core_1.MCPToolkit(serverParams, 'http')
        await toolkit.initialize()
        return toolkit.tools ?? []
    }
}
module.exports = { nodeClass: Figma_MCP }
//# sourceMappingURL=FigmaMCP.js.map
