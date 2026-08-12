import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { createGptAgentTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class GptAgent_Tools implements INode {
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
        this.label = 'GPT (Sub-Agent)'
        this.name = 'gptAgentTool'
        this.version = 1.0
        this.type = 'GptAgent'
        this.icon = 'gptagent.svg'
        this.category = 'Tools'
        this.description = 'Delegate a step to GPT as a callable sub-agent from within a flow'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['openAIApi']
        }
        this.inputs = [
            {
                label: 'Model',
                name: 'model',
                type: 'string',
                default: 'gpt-4o',
                description: 'Override with any current OpenAI model ID if this default becomes outdated'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const openAIApiKey = getCredentialParam('openAIApiKey', credentialData, nodeData)

        if (!openAIApiKey) {
            throw new Error('No OpenAI API key provided')
        }

        const model = (nodeData.inputs?.model as string) || 'gpt-4o'

        const tools = createGptAgentTools({
            model,
            apiKey: openAIApiKey
        })

        return tools
    }
}

module.exports = { nodeClass: GptAgent_Tools }
