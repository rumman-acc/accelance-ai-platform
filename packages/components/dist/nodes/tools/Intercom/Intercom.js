"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Intercom_Tools {
    constructor() {
        this.label = 'Intercom';
        this.name = 'intercomTool';
        this.version = 1.0;
        this.type = 'Intercom';
        this.icon = 'intercom.svg';
        this.category = 'Tools';
        this.description = 'Manage Intercom contacts and conversations';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['intercomApi']
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
                        label: 'Create Conversation',
                        name: 'create_conversation'
                    },
                    {
                        label: 'List Conversations',
                        name: 'list_conversations'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData);
        if (!accessToken) {
            throw new Error('No Intercom access token provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createIntercomTools)({
            actions,
            accessToken
        });
        return tools;
    }
}
module.exports = { nodeClass: Intercom_Tools };
//# sourceMappingURL=Intercom.js.map