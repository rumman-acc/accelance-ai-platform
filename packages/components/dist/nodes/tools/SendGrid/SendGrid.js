"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class SendGrid_Tools {
    constructor() {
        this.label = 'SendGrid';
        this.name = 'sendgridTool';
        this.version = 1.0;
        this.type = 'SendGrid';
        this.icon = 'sendgrid.svg';
        this.category = 'Tools';
        this.description = 'Send email and manage marketing contacts via SendGrid';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['sendgridApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Send Email',
                        name: 'send_email'
                    },
                    {
                        label: 'List Contacts',
                        name: 'list_contacts'
                    },
                    {
                        label: 'Add Contact',
                        name: 'add_contact'
                    },
                    {
                        label: 'List Templates',
                        name: 'list_templates'
                    },
                    {
                        label: 'Get Stats',
                        name: 'get_stats'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData);
        if (!apiKey) {
            throw new Error('No SendGrid API Key provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createSendGridTools)({
            actions,
            apiKey
        });
        return tools;
    }
}
module.exports = { nodeClass: SendGrid_Tools };
//# sourceMappingURL=SendGrid.js.map