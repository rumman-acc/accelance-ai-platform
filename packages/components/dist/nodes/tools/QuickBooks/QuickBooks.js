'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const core_1 = require('./core')
class QuickBooks_Tools {
    constructor() {
        this.label = 'QuickBooks'
        this.name = 'quickbooksTool'
        this.version = 1.0
        this.type = 'QuickBooks'
        this.icon = 'quickbooks.svg'
        this.category = 'Tools'
        this.description = 'Manage QuickBooks Online invoices, customers, and accounts'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['quickbooksApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Query',
                        name: 'query'
                    },
                    {
                        label: 'Create Customer',
                        name: 'create_customer'
                    },
                    {
                        label: 'Get Customer',
                        name: 'get_customer'
                    },
                    {
                        label: 'Create Invoice',
                        name: 'create_invoice'
                    },
                    {
                        label: 'Get Invoice',
                        name: 'get_invoice'
                    }
                ]
            }
        ]
    }
    async init(nodeData, _, options) {
        let credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const realmId = (0, utils_1.getCredentialParam)('realmId', credentialData, nodeData)
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData)
        if (!realmId || !accessToken) {
            throw new Error('Invalid credentials: provide both Realm ID and Access Token')
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions)
        const tools = (0, core_1.createQuickBooksTools)({
            actions,
            realmId,
            accessToken
        })
        return tools
    }
}
module.exports = { nodeClass: QuickBooks_Tools }
//# sourceMappingURL=QuickBooks.js.map
