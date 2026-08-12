import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { createClaudeAgentTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class ClaudeAgent_Tools implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Claude (Sub-Agent)'
        this.name = 'claudeAgentTool'
        this.version = 1.0
        this.type = 'ClaudeAgent'
        this.icon = 'claudeagent.svg'
        this.category = 'Tools'
        this.description = 'Delegate a step to Claude as a callable sub-agent from within a flow'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['anthropicApi']
        }
        this.inputs = [
            {
                label: 'Model',
                name: 'model',
                type: 'string',
                default: 'claude-sonnet-4-5-20250929',
                description: 'Override with any current Anthropic model ID if this default becomes outdated'
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                default: 1024,
                additionalParams: true,
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const anthropicApiKey = getCredentialParam('anthropicApiKey', credentialData, nodeData)

        if (!anthropicApiKey) {
            throw new Error('No Anthropic API key provided')
        }

        const model = (nodeData.inputs?.model as string) || 'claude-sonnet-4-5-20250929'
        const maxTokens = (nodeData.inputs?.maxTokens as number) || 1024

        const tools = createClaudeAgentTools({
            model,
            maxTokens,
            apiKey: anthropicApiKey
        })

        return tools
    }
}

module.exports = { nodeClass: ClaudeAgent_Tools }
