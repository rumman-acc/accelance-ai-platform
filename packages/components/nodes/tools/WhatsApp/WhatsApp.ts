import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createWhatsAppTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class WhatsApp_Tools implements INode {
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
        this.label = 'WhatsApp Business'
        this.name = 'whatsappTool'
        this.version = 1.0
        this.type = 'WhatsApp Business'
        this.icon = 'whatsapp.svg'
        this.category = 'Tools'
        this.description = 'Send messages via the WhatsApp Business Cloud API'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['whatsappApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Send Text Message',
                        name: 'send_text_message'
                    },
                    {
                        label: 'Send Template Message',
                        name: 'send_template_message'
                    },
                    {
                        label: 'Mark Message Read',
                        name: 'mark_message_read'
                    },
                    {
                        label: 'Get Media URL',
                        name: 'get_media_url'
                    },
                    {
                        label: 'Get Business Profile',
                        name: 'get_business_profile'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const phoneNumberId = getCredentialParam('phoneNumberId', credentialData, nodeData)
        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)

        if (!phoneNumberId || !accessToken) {
            throw new Error('Invalid credentials: Phone Number ID and Access Token are required')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createWhatsAppTools({
            actions,
            phoneNumberId,
            accessToken
        })

        return tools
    }
}

module.exports = { nodeClass: WhatsApp_Tools }
