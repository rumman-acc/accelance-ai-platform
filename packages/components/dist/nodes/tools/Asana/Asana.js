"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Asana_Tools {
    constructor() {
        this.label = 'Asana';
        this.name = 'asanaTool';
        this.version = 1.0;
        this.type = 'Asana';
        this.icon = 'asana.svg';
        this.category = 'Tools';
        this.description = 'Manage Asana tasks and projects';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['asanaApi']
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
                        label: 'List Projects',
                        name: 'list_projects'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const personalAccessToken = (0, utils_1.getCredentialParam)('personalAccessToken', credentialData, nodeData);
        if (!personalAccessToken) {
            throw new Error('No Asana Personal Access Token provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createAsanaTools)({
            actions,
            personalAccessToken
        });
        return tools;
    }
}
module.exports = { nodeClass: Asana_Tools };
//# sourceMappingURL=Asana.js.map