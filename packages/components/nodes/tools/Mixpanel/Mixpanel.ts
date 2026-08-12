import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createMixpanelTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Mixpanel_Tools implements INode {
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
        this.label = 'Mixpanel'
        this.name = 'mixpanelTool'
        this.version = 1.0
        this.type = 'Mixpanel'
        this.icon = 'mixpanel.svg'
        this.category = 'Tools'
        this.description = 'Send analytics events to Mixpanel'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mixpanelApi']
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
                        label: 'Set User Profile',
                        name: 'set_user_profile'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const projectToken = getCredentialParam('projectToken', credentialData, nodeData)

        if (!projectToken) {
            throw new Error('No Mixpanel Project Token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createMixpanelTools({
            actions,
            projectToken
        })

        return tools
    }
}

module.exports = { nodeClass: Mixpanel_Tools }
