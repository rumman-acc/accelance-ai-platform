"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Airtable_Tools {
    constructor() {
        this.label = 'Airtable';
        this.name = 'airtableTool';
        this.version = 1.0;
        this.type = 'Airtable';
        this.icon = 'airtable.svg';
        this.category = 'Tools';
        this.description = 'Read and write records in an Airtable base';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['airtableApi']
        };
        this.inputs = [
            {
                label: 'Base ID',
                name: 'baseId',
                type: 'string',
                placeholder: 'appXXXXXXXXXXXXXX'
            },
            {
                label: 'Table Name or ID',
                name: 'tableName',
                type: 'string',
                placeholder: 'Tasks'
            },
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Records',
                        name: 'list_records'
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
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const personalAccessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData);
        if (!personalAccessToken) {
            throw new Error('No Airtable Personal Access Token provided');
        }
        const baseId = nodeData.inputs?.baseId;
        const tableName = nodeData.inputs?.tableName;
        if (!baseId) {
            throw new Error('No Airtable Base ID provided');
        }
        if (!tableName) {
            throw new Error('No Airtable Table Name provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const defaultParams = {};
        const authConfig = {
            personalAccessToken
        };
        const tools = (0, core_1.createAirtableTools)({
            actions,
            personalAccessToken,
            baseId,
            tableName,
            defaultParams,
            authConfig
        });
        return tools;
    }
}
module.exports = { nodeClass: Airtable_Tools };
//# sourceMappingURL=Airtable.js.map