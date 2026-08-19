"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class JiraServiceManagement_Tools {
    constructor() {
        this.label = 'Jira Service Management';
        this.name = 'jiraServiceManagementTool';
        this.version = 1.0;
        this.type = 'JiraServiceManagement';
        this.icon = 'jirasm.svg';
        this.category = 'Tools';
        this.description = 'Manage Jira Service Management customer requests and service desks';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['jiraApi']
        };
        this.inputs = [
            {
                label: 'Site URL',
                name: 'siteUrl',
                type: 'string',
                placeholder: 'https://yourcompany.atlassian.net'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Service Desks',
                        name: 'list_service_desks'
                    },
                    {
                        label: 'Create Customer Request',
                        name: 'create_customer_request'
                    },
                    {
                        label: 'Get Request',
                        name: 'get_request'
                    },
                    {
                        label: 'List Requests',
                        name: 'list_requests'
                    },
                    {
                        label: 'Add Comment',
                        name: 'add_comment'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const siteUrl = nodeData.inputs?.siteUrl;
        if (!siteUrl) {
            throw new Error('No Jira Service Management site URL provided');
        }
        const username = (0, utils_1.getCredentialParam)('username', credentialData, nodeData);
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData);
        if (!username || !accessToken) {
            throw new Error('Invalid credentials: provide Username and Access Token');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createJiraServiceManagementTools)({
            actions,
            siteUrl,
            username,
            accessToken
        });
        return tools;
    }
}
module.exports = { nodeClass: JiraServiceManagement_Tools };
//# sourceMappingURL=JiraServiceManagement.js.map