"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Zoom_Tools {
    constructor() {
        this.label = 'Zoom';
        this.name = 'zoomTool';
        this.version = 1.0;
        this.type = 'Zoom';
        this.icon = 'zoom.svg';
        this.category = 'Tools';
        this.description = 'Manage Zoom meetings and users';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['zoomApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Meetings',
                        name: 'list_meetings'
                    },
                    {
                        label: 'Create Meeting',
                        name: 'create_meeting'
                    },
                    {
                        label: 'Get Meeting',
                        name: 'get_meeting'
                    },
                    {
                        label: 'Delete Meeting',
                        name: 'delete_meeting'
                    },
                    {
                        label: 'List Users',
                        name: 'list_users'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const accountId = (0, utils_1.getCredentialParam)('accountId', credentialData, nodeData);
        const clientId = (0, utils_1.getCredentialParam)('clientId', credentialData, nodeData);
        const clientSecret = (0, utils_1.getCredentialParam)('clientSecret', credentialData, nodeData);
        if (!accountId || !clientId || !clientSecret) {
            throw new Error('Invalid credentials: Account ID, Client ID, and Client Secret are all required');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createZoomTools)({
            actions,
            accountId,
            clientId,
            clientSecret
        });
        return tools;
    }
}
module.exports = { nodeClass: Zoom_Tools };
//# sourceMappingURL=Zoom.js.map