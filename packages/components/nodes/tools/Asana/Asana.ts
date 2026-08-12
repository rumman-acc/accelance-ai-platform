import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createAsanaTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Asana_Tools implements INode {
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
        this.label = 'Asana'
        this.name = 'asanaTool'
        this.version = 1.0
        this.type = 'Asana'
        this.icon = 'asana.svg'
        this.category = 'Tools'
        this.description = 'Manage Asana tasks and projects'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['asanaApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Tasks',
                        name: 'list_tasks'
                    },
                    {
                        label: 'Create Task',
                        name: 'create_task'
                    },
                    {
                        label: 'Get Task',
                        name: 'get_task'
                    },
                    {
                        label: 'Update Task',
                        name: 'update_task'
                    },
                    {
                        label: 'List Projects',
                        name: 'list_projects'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const personalAccessToken = getCredentialParam('personalAccessToken', credentialData, nodeData)

        if (!personalAccessToken) {
            throw new Error('No Asana Personal Access Token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createAsanaTools({
            actions,
            personalAccessToken
        })

        return tools
    }
}

module.exports = { nodeClass: Asana_Tools }
