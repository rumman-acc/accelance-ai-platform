import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam, refreshOAuth2Token } from '../../../src/utils'
import { createExcelOnlineTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class ExcelOnline_Tools implements INode {
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
        this.label = 'Excel Online'
        this.name = 'excelOnlineTool'
        this.version = 1.0
        this.type = 'ExcelOnline'
        this.icon = 'exceloneline.svg'
        this.category = 'Tools'
        this.description = 'Read and write Excel workbooks in OneDrive/SharePoint'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['excelOnlineOAuth2']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Worksheets',
                        name: 'list_worksheets'
                    },
                    {
                        label: 'Get Range',
                        name: 'get_range'
                    },
                    {
                        label: 'Update Range',
                        name: 'update_range'
                    },
                    {
                        label: 'Add Table Row',
                        name: 'add_table_row'
                    },
                    {
                        label: 'List Tables',
                        name: 'list_tables'
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

        const tools = createExcelOnlineTools({
            actions,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: ExcelOnline_Tools }
