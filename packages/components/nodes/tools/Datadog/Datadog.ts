import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createDatadogTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Datadog_Tools implements INode {
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
        this.label = 'Datadog'
        this.name = 'datadogTool'
        this.version = 1.0
        this.type = 'Datadog'
        this.icon = 'datadog.svg'
        this.category = 'Tools'
        this.description = 'Query metrics and manage Datadog monitors'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['datadogApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Monitors',
                        name: 'list_monitors'
                    },
                    {
                        label: 'Get Monitor',
                        name: 'get_monitor'
                    },
                    {
                        label: 'Create Monitor',
                        name: 'create_monitor'
                    },
                    {
                        label: 'Post Event',
                        name: 'post_event'
                    },
                    {
                        label: 'Query Metrics',
                        name: 'query_metrics'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
        const appKey = getCredentialParam('appKey', credentialData, nodeData)
        const site = getCredentialParam('site', credentialData, nodeData)

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions as string)

        const tools = createDatadogTools({
            actions,
            apiKey,
            appKey,
            site
        })

        return tools
    }
}

module.exports = { nodeClass: Datadog_Tools }
