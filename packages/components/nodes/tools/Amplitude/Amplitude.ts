import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createAmplitudeTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Amplitude_Tools implements INode {
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
        this.label = 'Amplitude'
        this.name = 'amplitudeTool'
        this.version = 1.0
        this.type = 'Amplitude'
        this.icon = 'amplitude.svg'
        this.category = 'Tools'
        this.description = 'Send analytics events to Amplitude'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['amplitudeApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Track Event',
                        name: 'track_event'
                    },
                    {
                        label: 'Identify User',
                        name: 'identify_user'
                    },
                    {
                        label: 'Batch Track Events',
                        name: 'batch_track_events'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
        const secretKey = getCredentialParam('secretKey', credentialData, nodeData)

        if (!apiKey) {
            throw new Error('No Amplitude API Key provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createAmplitudeTools({
            actions,
            apiKey,
            secretKey
        })

        return tools
    }
}

module.exports = { nodeClass: Amplitude_Tools }
