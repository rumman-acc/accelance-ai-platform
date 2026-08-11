import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createDocusignTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Docusign_Tools implements INode {
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
        this.label = 'DocuSign'
        this.name = 'docusignTool'
        this.version = 1.0
        this.type = 'DocuSign'
        this.icon = 'docusign.svg'
        this.category = 'Tools'
        this.description = 'Send documents for e-signature and check envelope status via DocuSign'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['docusignApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create Envelope',
                        name: 'create_envelope'
                    },
                    {
                        label: 'Get Envelope Status',
                        name: 'get_envelope_status'
                    },
                    {
                        label: 'List Envelopes',
                        name: 'list_envelopes'
                    },
                    {
                        label: 'Void Envelope',
                        name: 'void_envelope'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        let credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const accountBaseUri = getCredentialParam('accountBaseUri', credentialData, nodeData)
        const accountId = getCredentialParam('accountId', credentialData, nodeData)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!accountBaseUri || !accountId || !accessToken) {
            throw new Error('Invalid credentials: accountBaseUri, accountId and accessToken are all required')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createDocusignTools({
            actions,
            accountBaseUri,
            accountId,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: Docusign_Tools }
