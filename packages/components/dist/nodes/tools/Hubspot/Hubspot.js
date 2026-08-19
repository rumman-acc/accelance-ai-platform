"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Hubspot_Tools {
    constructor() {
        this.label = 'HubSpot';
        this.name = 'hubspotTool';
        this.version = 1.0;
        this.type = 'HubSpot';
        this.icon = 'hubspot.svg';
        this.category = 'Tools';
        this.description = 'Manage HubSpot CRM contacts and deals';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['hubspotApi']
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
                        label: 'Get Contact',
                        name: 'get_contact'
                    },
                    {
                        label: 'Update Contact',
                        name: 'update_contact'
                    },
                    {
                        label: 'List Deals',
                        name: 'list_deals'
                    },
                    {
                        label: 'Create Deal',
                        name: 'create_deal'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const privateAppToken = (0, utils_1.getCredentialParam)('privateAppToken', credentialData, nodeData);
        if (!privateAppToken) {
            throw new Error('No HubSpot Private App Access Token provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createHubspotTools)({
            actions,
            privateAppToken
        });
        return tools;
    }
}
module.exports = { nodeClass: Hubspot_Tools };
//# sourceMappingURL=Hubspot.js.map