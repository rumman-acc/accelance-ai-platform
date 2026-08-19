'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class Docusign_Tools {
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
    async init(nodeData, _, options) {
        let credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const accountBaseUri = (0, utils_1.getCredentialParam)('accountBaseUri', credentialData, nodeData)
        const accountId = (0, utils_1.getCredentialParam)('accountId', credentialData, nodeData)
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData)
        if (!accountBaseUri || !accountId || !accessToken) {
            throw new Error('Invalid credentials: accountBaseUri, accountId and accessToken are all required')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createDocusignTools)({
            actions,
            accountBaseUri,
            accountId,
            accessToken
        })
        return tools
    }
}
module.exports = { nodeClass: Docusign_Tools }
//# sourceMappingURL=Docusign.js.map
