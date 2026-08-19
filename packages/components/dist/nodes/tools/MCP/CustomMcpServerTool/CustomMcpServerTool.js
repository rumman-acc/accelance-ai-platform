'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const core_1 = require('../core')
const utils_1 = require('../../../../src/utils')
class CustomMcpServerTool {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            listServers: async (_, options) => {
                try {
                    const appDataSource = options.appDataSource
                    const databaseEntities = options.databaseEntities
                    if (!appDataSource || !databaseEntities?.['CustomMcpServer']) {
                        return []
                    }
                    const workspaceId = options.searchOptions?.workspaceId
                    if (!workspaceId) return []
                    const mcpServers = await appDataSource.getRepository(databaseEntities['CustomMcpServer']).find({
                        where: { workspaceId, status: 'AUTHORIZED' },
                        order: { updatedDate: 'DESC' }
                    })
                    return mcpServers.map((server) => {
                        let description
                        if (server.transportType === 'stdio') {
                            description = server.command ? `${server.command} (local process)` : 'local process'
                        } else {
                            try {
                                const parsed = new URL(server.serverUrl)
                                description = parsed.pathname && parsed.pathname !== '/' ? `${parsed.origin}/************` : parsed.origin
                            } catch {
                                description = '************'
                            }
                        }
                        return {
                            label: server.name,
                            name: server.id,
                            description
                        }
                    })
                } catch (error) {
                    return []
                }
            },
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
                            description: 'Select an authorized MCP server first, then refresh'
                        }
                    ]
                }
            }
        }
        /**
         * Formats the tool name to ensure it is a valid identifier by replacing spaces and special characters with underscores.
         * This is necessary because tool names may be used as identifiers in various contexts where special characters could cause issues.
         * For example, a tool named "Get User Info" would be formatted to "Get_User_Info".
         * This method can be enhanced further to handle edge cases as needed.
         */
        this.formatToolName = (name) => name.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
        this.label = 'Custom MCP Server'
        this.name = 'customMcpServerTool'
        this.version = 1.0
        this.type = 'Custom MCP Server Tool'
        this.icon = 'customMCP.png'
        this.category = 'Tools (MCP)'
        this.description = 'Use tools from authorized MCP servers configured in workspace'
        this.inputs = [
            {
                label: 'Custom MCP Server',
                name: 'mcpServerId',
                type: 'asyncOptions',
                loadMethod: 'listServers'
            },
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
        const serverId = nodeData.inputs?.mcpServerId
        if (!serverId) {
            throw new Error('MCP Server is required')
        }
        const appDataSource = options.appDataSource
        const databaseEntities = options.databaseEntities
        if (!appDataSource || !databaseEntities?.['CustomMcpServer']) {
            throw new Error('Database not available')
        }
        const workspaceId = options.workspaceId ?? options.searchOptions?.workspaceId
        if (!workspaceId) {
            throw new Error('Workspace context is required to load MCP server')
        }
        const serverRecord = await appDataSource.getRepository(databaseEntities['CustomMcpServer']).findOneBy({ id: serverId, workspaceId })
        if (!serverRecord) {
            throw new Error(`MCP server ${serverId} not found`)
        }
        if (serverRecord.status !== 'AUTHORIZED') {
            throw new Error(`MCP server "${serverRecord.name}" is not authorized. Please authorize it in the Tools page first.`)
        }
        let serverParams
        let transport
        if (serverRecord.transportType === 'stdio') {
            const args = serverRecord.args ? JSON.parse(serverRecord.args) : []
            let env
            if (serverRecord.env) {
                try {
                    env = await (0, utils_1.decryptCredentialData)(serverRecord.env)
                } catch {
                    // env decryption failed — launch without it
                }
            }
            // Re-validate at execution time too, not just at save time (defense in depth).
            ;(0, core_1.validateMCPServerConfig)({ command: serverRecord.command, args, env })
            serverParams = { command: serverRecord.command, args, ...(env ? { env } : {}) }
            transport = 'stdio'
        } else {
            // Build headers from encrypted authConfig — only when authType explicitly requires them
            let headers = {}
            if (serverRecord.authType === 'CUSTOM_HEADERS' && serverRecord.authConfig) {
                try {
                    const decrypted = await (0, utils_1.decryptCredentialData)(serverRecord.authConfig)
                    if (decrypted?.headers && typeof decrypted.headers === 'object') {
                        headers = decrypted.headers
                    }
                } catch {
                    // authConfig decryption failed — proceed without headers
                }
            }
            serverParams = {
                url: serverRecord.serverUrl,
                ...(Object.keys(headers).length > 0 ? { headers } : {})
            }
            transport = 'sse'
        }
        if (options.cachePool) {
            const cacheKey = `mcpServer_${serverId}`
            const cachedResult = await options.cachePool.getMCPCache(cacheKey)
            if (cachedResult) {
                return cachedResult.tools
            }
        }
        const toolkit = new core_1.MCPToolkit(serverParams, transport)
        await toolkit.initialize()
        const tools = toolkit.tools ?? []
        if (options.cachePool) {
            const cacheKey = `mcpServer_${serverId}`
            await options.cachePool.addMCPCache(cacheKey, { toolkit, tools })
        }
        return tools.map((tool) => {
            tool.name = this.formatToolName(tool.name)
            return tool
        })
    }
}
module.exports = { nodeClass: CustomMcpServerTool }
//# sourceMappingURL=CustomMcpServerTool.js.map
