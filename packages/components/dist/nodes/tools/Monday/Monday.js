"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Monday_Tools {
    constructor() {
        this.label = 'monday.com';
        this.name = 'mondayTool';
        this.version = 1.0;
        this.type = 'Monday';
        this.icon = 'monday.svg';
        this.category = 'Tools';
        this.description = 'Manage monday.com boards and items';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mondayApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Boards',
                        name: 'list_boards'
                    },
                    {
                        label: 'Create Item',
                        name: 'create_item'
                    },
                    {
                        label: 'List Items',
                        name: 'list_items'
                    },
                    {
                        label: 'Get Item',
                        name: 'get_item'
                    },
                    {
                        label: 'Update Item Column',
                        name: 'update_item_column'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiToken = (0, utils_1.getCredentialParam)('apiToken', credentialData, nodeData);
        if (!apiToken) {
            throw new Error('No monday.com API token provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createMondayTools)({
            actions,
            apiToken
        });
        return tools;
    }
}
module.exports = { nodeClass: Monday_Tools };
//# sourceMappingURL=Monday.js.map