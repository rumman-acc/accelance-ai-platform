import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createAirtableTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Airtable_Tools implements INode {
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
        this.label = 'Airtable'
        this.name = 'airtableTool'
        this.version = 1.0
        this.type = 'Airtable'
        this.icon = 'airtable.svg'
        this.category = 'Tools'
        this.description = 'Read and write records in an Airtable base'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['airtableApi']
        }
        this.inputs = [
            {
                label: 'Base ID',
                name: 'baseId',
                type: 'string',
                placeholder: 'appXXXXXXXXXXXXXX'
            },
            {
                label: 'Table Name or ID',
                name: 'tableName',
                type: 'string',
                placeholder: 'Tasks'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Records',
                        name: 'list_records'
                    },
                    {
                        label: 'Create Record',
                        name: 'create_record'
                    },
                    {
                        label: 'Get Record',
                        name: 'get_record'
                    },
                    {
                        label: 'Update Record',
                        name: 'update_record'
                    },
                    {
                        label: 'Delete Record',
                        name: 'delete_record'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const personalAccessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!personalAccessToken) {
            throw new Error('No Airtable Personal Access Token provided')
        }

        const baseId = nodeData.inputs?.baseId as string
        const tableName = nodeData.inputs?.tableName as string

        if (!baseId) {
            throw new Error('No Airtable Base ID provided')
        }

        if (!tableName) {
            throw new Error('No Airtable Table Name provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const defaultParams: Record<string, any> = {}

        const authConfig = {
            personalAccessToken
        }

        const tools = createAirtableTools({
            actions,
            personalAccessToken,
            baseId,
            tableName,
            defaultParams,
            authConfig
        })

        return tools
    }
}

module.exports = { nodeClass: Airtable_Tools }
