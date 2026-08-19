'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Twilio_Tools {
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
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const accountSid = (0, utils_1.getCredentialParam)('accountSid', credentialData, nodeData)
        const authToken = (0, utils_1.getCredentialParam)('authToken', credentialData, nodeData)
        if (!accountSid || !authToken) {
            throw new Error('Invalid credentials: provide both Account SID and Auth Token')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const authConfig = {
            accountSid,
            authToken
        }
        const tools = (0, core_1.createTwilioTools)({
            actions,
            accountSid,
            authToken,
            authConfig
        })
        return tools
    }
}
module.exports = { nodeClass: Twilio_Tools }
//# sourceMappingURL=Twilio.js.map
