import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam, refreshOAuth2Token } from '../../../src/utils'
import { createSharePointTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SharePoint_Tools implements INode {
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
        this.label = 'SharePoint'
        this.name = 'sharePointTool'
        this.version = 1.0
        this.type = 'SharePoint'
        this.icon = 'sharepoint.svg'
        this.category = 'Tools'
        this.description = 'Manage SharePoint sites, lists, and files'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['sharePointOAuth2']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Get Site',
                        name: 'get_site'
                    },
                    {
                        label: 'List Lists',
                        name: 'list_lists'
                    },
                    {
                        label: 'List List Items',
                        name: 'list_list_items'
                    },
                    {
                        label: 'Create List Item',
                        name: 'create_list_item'
                    },
                    {
                        label: 'List Drive Items',
                        name: 'list_drive_items'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        let credentialData = await getCredentialData(nodeData.credential ?? '', options)
        credentialData = await refreshOAuth2Token(nodeData.credential ?? '', credentialData, options)
        const accessToken = getCredentialParam('access_token', credentialData, nodeData)

        if (!accessToken) {
            throw new Error('No access token found in credential')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createSharePointTools({
            actions,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: SharePoint_Tools }
