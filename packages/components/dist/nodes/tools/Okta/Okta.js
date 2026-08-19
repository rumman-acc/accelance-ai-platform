"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Okta_Tools {
    constructor() {
        this.label = 'Okta';
        this.name = 'oktaTool';
        this.version = 1.0;
        this.type = 'Okta';
        this.icon = 'okta.svg';
        this.category = 'Tools';
        this.description = 'Manage Okta users and groups';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['oktaApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Users',
                        name: 'list_users'
                    },
                    {
                        label: 'Get User',
                        name: 'get_user'
                    },
                    {
                        label: 'Create User',
                        name: 'create_user'
                    },
                    {
                        label: 'List Groups',
                        name: 'list_groups'
                    },
                    {
                        label: 'Add User to Group',
                        name: 'add_user_to_group'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const oktaDomain = (0, utils_1.getCredentialParam)('oktaDomain', credentialData, nodeData);
        const apiToken = (0, utils_1.getCredentialParam)('apiToken', credentialData, nodeData);
        if (!oktaDomain) {
            throw new Error('No Okta domain provided');
        }
        if (!apiToken) {
            throw new Error('No Okta API token provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createOktaTools)({
            actions,
            oktaDomain,
            apiToken
        });
        return tools;
    }
}
module.exports = { nodeClass: Okta_Tools };
//# sourceMappingURL=Okta.js.map