"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class ClickUp_Tools {
    constructor() {
        this.label = 'ClickUp';
        this.name = 'clickupTool';
        this.version = 1.0;
        this.type = 'ClickUp';
        this.icon = 'clickup.svg';
        this.category = 'Tools';
        this.description = 'Manage ClickUp tasks and lists';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['clickupApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Tasks',
                        name: 'list_tasks'
                    },
                    {
                        label: 'Create Task',
                        name: 'create_task'
                    },
                    {
                        label: 'Get Task',
                        name: 'get_task'
                    },
                    {
                        label: 'Update Task',
                        name: 'update_task'
                    },
                    {
                        label: 'List Spaces',
                        name: 'list_spaces'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiToken = (0, utils_1.getCredentialParam)('apiToken', credentialData, nodeData);
        if (!apiToken) {
            throw new Error('No ClickUp API Token provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createClickUpTools)({
            actions,
            apiToken
        });
        return tools;
    }
}
module.exports = { nodeClass: ClickUp_Tools };
//# sourceMappingURL=ClickUp.js.map