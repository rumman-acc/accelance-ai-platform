import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createDropboxTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Dropbox_Tools implements INode {
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
        this.label = 'Dropbox'
        this.name = 'dropboxTool'
        this.version = 1.0
        this.type = 'Dropbox'
        this.icon = 'dropbox.svg'
        this.category = 'Tools'
        this.description = 'Manage files and folders in Dropbox'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['dropboxApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Folder',
                        name: 'list_folder'
                    },
                    {
                        label: 'Create Folder',
                        name: 'create_folder'
                    },
                    {
                        label: 'Delete',
                        name: 'delete'
                    },
                    {
                        label: 'Get Metadata',
                        name: 'get_metadata'
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
            throw new Error('No Dropbox access token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createDropboxTools({
            actions,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: Dropbox_Tools }
