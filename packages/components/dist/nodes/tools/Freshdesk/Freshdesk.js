"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Freshdesk_Tools {
    constructor() {
        this.label = 'Freshdesk';
        this.name = 'freshdeskTool';
        this.version = 1.0;
        this.type = 'Freshdesk';
        this.icon = 'freshdesk.svg';
        this.category = 'Tools';
        this.description = 'Manage Freshdesk support tickets and contacts';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['freshdeskApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Tickets',
                        name: 'list_tickets'
                    },
                    {
                        label: 'Create Ticket',
                        name: 'create_ticket'
                    },
                    {
                        label: 'Get Ticket',
                        name: 'get_ticket'
                    },
                    {
                        label: 'Update Ticket',
                        name: 'update_ticket'
                    },
                    {
                        label: 'List Contacts',
                        name: 'list_contacts'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const domain = (0, utils_1.getCredentialParam)('domain', credentialData, nodeData);
        const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData);
        if (!domain || !apiKey) {
            throw new Error('Invalid credentials: provide Domain and API Key');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createFreshdeskTools)({
            actions,
            domain,
            apiKey
        });
        return tools;
    }
}
module.exports = { nodeClass: Freshdesk_Tools };
//# sourceMappingURL=Freshdesk.js.map