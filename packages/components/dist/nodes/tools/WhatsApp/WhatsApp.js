'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class WhatsApp_Tools {
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
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const phoneNumberId = (0, utils_1.getCredentialParam)('phoneNumberId', credentialData, nodeData)
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData)
        if (!phoneNumberId || !accessToken) {
            throw new Error('Invalid credentials: Phone Number ID and Access Token are required')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createWhatsAppTools)({
            actions,
            phoneNumberId,
            accessToken
        })
        return tools
    }
}
module.exports = { nodeClass: WhatsApp_Tools }
//# sourceMappingURL=WhatsApp.js.map
