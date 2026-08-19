"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Xero_Tools {
    constructor() {
        this.label = 'Xero';
        this.name = 'xeroTool';
        this.version = 1.0;
        this.type = 'Xero';
        this.icon = 'xero.svg';
        this.category = 'Tools';
        this.description = 'Manage Xero invoices, contacts, and accounts';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['xeroApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Contacts',
                        name: 'list_contacts'
                    },
                    {
                        label: 'Create Contact',
                        name: 'create_contact'
                    },
                    {
                        label: 'List Invoices',
                        name: 'list_invoices'
                    },
                    {
                        label: 'Create Invoice',
                        name: 'create_invoice'
                    },
                    {
                        label: 'List Accounts',
                        name: 'list_accounts'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        let credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const tenantId = (0, utils_1.getCredentialParam)('tenantId', credentialData, nodeData);
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData);
        if (!tenantId || !accessToken) {
            throw new Error('Invalid credentials: provide both Tenant ID and Access Token');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createXeroTools)({
            actions,
            tenantId,
            accessToken
        });
        return tools;
    }
}
module.exports = { nodeClass: Xero_Tools };
//# sourceMappingURL=Xero.js.map