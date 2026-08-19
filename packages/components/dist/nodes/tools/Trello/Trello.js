"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Trello_Tools {
    constructor() {
        this.label = 'Trello';
        this.name = 'trelloTool';
        this.version = 1.0;
        this.type = 'Trello';
        this.icon = 'trello.svg';
        this.category = 'Tools';
        this.description = 'Manage Trello boards and cards';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['trelloApi']
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
                        label: 'List Cards',
                        name: 'list_cards'
                    },
                    {
                        label: 'Create Card',
                        name: 'create_card'
                    },
                    {
                        label: 'Get Card',
                        name: 'get_card'
                    },
                    {
                        label: 'Update Card',
                        name: 'update_card'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData);
        const apiToken = (0, utils_1.getCredentialParam)('apiToken', credentialData, nodeData);
        if (!apiKey || !apiToken) {
            throw new Error('Invalid credentials: provide both API Key and API Token');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createTrelloTools)({
            actions,
            apiKey,
            apiToken
        });
        return tools;
    }
}
module.exports = { nodeClass: Trello_Tools };
//# sourceMappingURL=Trello.js.map