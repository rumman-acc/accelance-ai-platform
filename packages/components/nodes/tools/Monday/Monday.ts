import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createMondayTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Monday_Tools implements INode {
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
        this.label = 'monday.com'
        this.name = 'mondayTool'
        this.version = 1.0
        this.type = 'Monday'
        this.icon = 'monday.svg'
        this.category = 'Tools'
        this.description = 'Manage monday.com boards and items'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mondayApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Boards',
                        name: 'list_boards'
                    },
                    {
                        label: 'Create Item',
                        name: 'create_item'
                    },
                    {
                        label: 'List Items',
                        name: 'list_items'
                    },
                    {
                        label: 'Get Item',
                        name: 'get_item'
                    },
                    {
                        label: 'Update Item Column',
                        name: 'update_item_column'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)

        if (!apiToken) {
            throw new Error('No monday.com API token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createMondayTools({
            actions,
            apiToken
        })

        return tools
    }
}

module.exports = { nodeClass: Monday_Tools }
