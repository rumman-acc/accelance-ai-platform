import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createKlaviyoTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Klaviyo_Tools implements INode {
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
        this.label = 'Klaviyo'
        this.name = 'klaviyoTool'
        this.version = 1.0
        this.type = 'Klaviyo'
        this.icon = 'klaviyo.svg'
        this.category = 'Tools'
        this.description = 'Manage Klaviyo profiles and lists'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['klaviyoApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Profiles',
                        name: 'list_profiles'
                    },
                    {
                        label: 'Create Profile',
                        name: 'create_profile'
                    },
                    {
                        label: 'Get Profile',
                        name: 'get_profile'
                    },
                    {
                        label: 'List Lists',
                        name: 'list_lists'
                    },
                    {
                        label: 'Subscribe Profile to List',
                        name: 'subscribe_profile_to_list'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const privateApiKey = getCredentialParam('privateApiKey', credentialData, nodeData)

        if (!privateApiKey) {
            throw new Error('No Klaviyo private API key provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createKlaviyoTools({
            actions,
            privateApiKey
        })

        return tools
    }
}

module.exports = { nodeClass: Klaviyo_Tools }
