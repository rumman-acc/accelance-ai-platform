import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../../src/utils'
import { MCPToolkit } from '../core'

class Notion_MCP implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    documentation: string
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Notion MCP'
        this.name = 'notionMCP'
        this.version = 1.0
        this.type = 'Notion MCP Tool'
        this.icon = 'notion.svg'
        this.category = 'Tools (MCP)'
        this.description = "Notion's official open-source MCP server for pages, databases, and comments"
        this.documentation = 'https://github.com/makenotion/notion-mcp-server'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['notionApi']
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

    //@ts-ignore
    loadMethods = {
        listActions: async (nodeData: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> => {
            try {
                const toolset = await this.getTools(nodeData, options)
                toolset.sort((a: any, b: any) => a.name.localeCompare(b.name))

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
                        description: 'No available actions, please check your Notion Internal Integration Secret and refresh'
                    }
                ]
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
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

        return tools.filter((tool: any) => mcpActions.includes(tool.name))
    }

    async getTools(nodeData: INodeData, options: ICommonObject): Promise<Tool[]> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const integrationSecret = getCredentialParam('notionIntegrationToken', credentialData, nodeData)

        if (!integrationSecret) {
            throw new Error('Missing Notion Internal Integration Secret')
        }

        // Notion's hosted remote MCP (mcp.notion.com) requires an interactive OAuth consent
        // flow with a user in the loop, which doesn't fit an unattended backend agent. The
        // self-hosted server (run over stdio here) accepts a straightforward integration
        // secret instead, matching how every other credential-based tool on this platform works.
        const serverParams = {
            command: 'npx',
            args: ['-y', '@notionhq/notion-mcp-server'],
            env: {
                OPENAPI_MCP_HEADERS: JSON.stringify({
                    Authorization: `Bearer ${integrationSecret}`,
                    'Notion-Version': '2022-06-28'
                })
            }
        }

        const toolkit = new MCPToolkit(serverParams, 'stdio')
        await toolkit.initialize()

        return (toolkit.tools ?? []) as Tool[]
    }
}

module.exports = { nodeClass: Notion_MCP }
