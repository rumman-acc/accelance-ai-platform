import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createZoomTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Zoom_Tools implements INode {
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
        this.label = 'Zoom'
        this.name = 'zoomTool'
        this.version = 1.0
        this.type = 'Zoom'
        this.icon = 'zoom.svg'
        this.category = 'Tools'
        this.description = 'Manage Zoom meetings and users'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['zoomApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Meetings',
                        name: 'list_meetings'
                    },
                    {
                        label: 'Create Meeting',
                        name: 'create_meeting'
                    },
                    {
                        label: 'Get Meeting',
                        name: 'get_meeting'
                    },
                    {
                        label: 'Delete Meeting',
                        name: 'delete_meeting'
                    },
                    {
                        label: 'List Users',
                        name: 'list_users'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const accountId = getCredentialParam('accountId', credentialData, nodeData)
        const clientId = getCredentialParam('clientId', credentialData, nodeData)
        const clientSecret = getCredentialParam('clientSecret', credentialData, nodeData)

        if (!accountId || !clientId || !clientSecret) {
            throw new Error('Invalid credentials: Account ID, Client ID, and Client Secret are all required')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createZoomTools({
            actions,
            accountId,
            clientId,
            clientSecret
        })

        return tools
    }
}

module.exports = { nodeClass: Zoom_Tools }
