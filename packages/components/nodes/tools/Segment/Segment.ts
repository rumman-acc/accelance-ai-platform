import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createSegmentTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Segment_Tools implements INode {
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
        this.label = 'Segment'
        this.name = 'segmentTool'
        this.version = 1.0
        this.type = 'Segment'
        this.icon = 'segment.svg'
        this.category = 'Tools'
        this.description = 'Send analytics events to Segment'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['segmentApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Track',
                        name: 'track'
                    },
                    {
                        label: 'Identify',
                        name: 'identify'
                    },
                    {
                        label: 'Page',
                        name: 'page'
                    },
                    {
                        label: 'Group',
                        name: 'group'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const writeKey = getCredentialParam('writeKey', credentialData, nodeData)

        if (!writeKey) {
            throw new Error('No Segment write key provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createSegmentTools({
            actions,
            writeKey
        })

        return tools
    }
}

module.exports = { nodeClass: Segment_Tools }
