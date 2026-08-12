import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createBoxTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Box_Tools implements INode {
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
        this.label = 'Box'
        this.name = 'boxTool'
        this.version = 1.0
        this.type = 'Box'
        this.icon = 'box.svg'
        this.category = 'Tools'
        this.description = 'Manage files and folders in Box'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['boxApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Folder Items',
                        name: 'list_folder_items'
                    },
                    {
                        label: 'Create Folder',
                        name: 'create_folder'
                    },
                    {
                        label: 'Get File Info',
                        name: 'get_file_info'
                    },
                    {
                        label: 'Delete File',
                        name: 'delete_file'
                    },
                    {
                        label: 'Search',
                        name: 'search'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!accessToken) {
            throw new Error('No Box access token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createBoxTools({
            actions,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: Box_Tools }
