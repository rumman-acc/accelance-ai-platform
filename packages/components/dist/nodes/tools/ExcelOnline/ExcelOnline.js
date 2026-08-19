"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class ExcelOnline_Tools {
    constructor() {
        this.label = 'Excel Online';
        this.name = 'excelOnlineTool';
        this.version = 1.0;
        this.type = 'ExcelOnline';
        this.icon = 'exceloneline.svg';
        this.category = 'Tools';
        this.description = 'Read and write Excel workbooks in OneDrive/SharePoint';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['excelOnlineOAuth2']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Worksheets',
                        name: 'list_worksheets'
                    },
                    {
                        label: 'Get Range',
                        name: 'get_range'
                    },
                    {
                        label: 'Update Range',
                        name: 'update_range'
                    },
                    {
                        label: 'Add Table Row',
                        name: 'add_table_row'
                    },
                    {
                        label: 'List Tables',
                        name: 'list_tables'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        let credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        credentialData = await (0, utils_1.refreshOAuth2Token)(nodeData.credential ?? '', credentialData, options);
        const accessToken = (0, utils_1.getCredentialParam)('access_token', credentialData, nodeData);
        if (!accessToken) {
            throw new Error('No access token found in credential');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createExcelOnlineTools)({
            actions,
            accessToken
        });
        return tools;
    }
}
module.exports = { nodeClass: ExcelOnline_Tools };
//# sourceMappingURL=ExcelOnline.js.map