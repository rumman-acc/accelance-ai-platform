"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Salesforce_Tools {
    constructor() {
        this.label = 'Salesforce';
        this.name = 'salesforceTool';
        this.version = 1.0;
        this.type = 'Salesforce';
        this.icon = 'salesforce.svg';
        this.category = 'Tools';
        this.description = 'Query and manage Salesforce records (Leads, Contacts, Accounts, Opportunities, or any custom object)';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['salesforceApi']
        };
        this.inputs = [
            {
                label: 'API Version',
                name: 'apiVersion',
                type: 'string',
                default: 'v62.0',
                description: 'Salesforce REST API version to call, e.g. v62.0. Salesforce deprecates old versions roughly once a year, so this may need bumping periodically.'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Query Records',
                        name: 'query_records'
                    },
                    {
                        label: 'Create Record',
                        name: 'create_record'
                    },
                    {
                        label: 'Get Record',
                        name: 'get_record'
                    },
                    {
                        label: 'Update Record',
                        name: 'update_record'
                    },
                    {
                        label: 'Delete Record',
                        name: 'delete_record'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        let credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const instanceUrl = (0, utils_1.getCredentialParam)('instanceUrl', credentialData, nodeData);
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData);
        if (!instanceUrl || !accessToken) {
            throw new Error('Invalid credentials: provide both Instance URL and Access Token');
        }
        const apiVersion = nodeData.inputs?.apiVersion || 'v62.0';
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createSalesforceTools)({
            actions,
            instanceUrl,
            accessToken,
            apiVersion
        });
        return tools;
    }
}
module.exports = { nodeClass: Salesforce_Tools };
//# sourceMappingURL=Salesforce.js.map