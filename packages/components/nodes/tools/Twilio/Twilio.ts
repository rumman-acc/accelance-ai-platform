import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createTwilioTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class Twilio_Tools implements INode {
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
        this.label = 'Twilio'
        this.name = 'twilioTool'
        this.version = 1.0
        this.type = 'Twilio'
        this.icon = 'twilio.svg'
        this.category = 'Tools'
        this.description = 'Send SMS messages and make phone calls via Twilio'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['twilioApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Send SMS',
                        name: 'send_sms'
                    },
                    {
                        label: 'List Messages',
                        name: 'list_messages'
                    },
                    {
                        label: 'Get Message',
                        name: 'get_message'
                    },
                    {
                        label: 'Make Call',
                        name: 'make_call'
                    },
                    {
                        label: 'List Calls',
                        name: 'list_calls'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const accountSid = getCredentialParam('accountSid', credentialData, nodeData)
        const authToken = getCredentialParam('authToken', credentialData, nodeData)

        if (!accountSid || !authToken) {
            throw new Error('Invalid credentials: provide both Account SID and Auth Token')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const authConfig = {
            accountSid,
            authToken
        }

        const tools = createTwilioTools({
            actions,
            accountSid,
            authToken,
            authConfig
        })

        return tools
    }
}

module.exports = { nodeClass: Twilio_Tools }
