"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Dropbox_Tools {
    constructor() {
        this.label = 'Dropbox';
        this.name = 'dropboxTool';
        this.version = 1.0;
        this.type = 'Dropbox';
        this.icon = 'dropbox.svg';
        this.category = 'Tools';
        this.description = 'Manage files and folders in Dropbox';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['dropboxApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Folder',
                        name: 'list_folder'
                    },
                    {
                        label: 'Create Folder',
                        name: 'create_folder'
                    },
                    {
                        label: 'Delete',
                        name: 'delete'
                    },
                    {
                        label: 'Get Metadata',
                        name: 'get_metadata'
                    },
                    {
                        label: 'Search',
                        name: 'search'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData);
        if (!accessToken) {
            throw new Error('No Dropbox access token provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createDropboxTools)({
            actions,
            accessToken
        });
        return tools;
    }
}
module.exports = { nodeClass: Dropbox_Tools };
//# sourceMappingURL=Dropbox.js.map