import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam, refreshOAuth2Token } from '../../../src/utils'
import { createOneDriveTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class OneDrive_Tools implements INode {
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
        this.label = 'OneDrive'
        this.name = 'oneDriveTool'
        this.version = 1.0
        this.type = 'OneDrive'
        this.icon = 'onedrive.svg'
        this.category = 'Tools'
        this.description = 'Manage files and folders in OneDrive'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['oneDriveOAuth2']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Root Items',
                        name: 'list_root_items'
                    },
                    {
                        label: 'List Folder Items',
                        name: 'list_folder_items'
                    },
                    {
                        label: 'Get Item',
                        name: 'get_item'
                    },
                    {
                        label: 'Create Folder',
                        name: 'create_folder'
                    },
                    {
                        label: 'Delete Item',
                        name: 'delete_item'
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

        const tools = createOneDriveTools({
            actions,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: OneDrive_Tools }
