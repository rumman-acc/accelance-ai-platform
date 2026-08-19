"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class PagerDuty_Tools {
    constructor() {
        this.label = 'PagerDuty';
        this.name = 'pagerdutyTool';
        this.version = 1.0;
        this.type = 'PagerDuty';
        this.icon = 'pagerduty.svg';
        this.category = 'Tools';
        this.description = 'Manage PagerDuty incidents and services';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['pagerdutyApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Incidents',
                        name: 'list_incidents'
                    },
                    {
                        label: 'Get Incident',
                        name: 'get_incident'
                    },
                    {
                        label: 'Create Incident',
                        name: 'create_incident'
                    },
                    {
                        label: 'Update Incident',
                        name: 'update_incident'
                    },
                    {
                        label: 'List Services',
                        name: 'list_services'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiToken = (0, utils_1.getCredentialParam)('apiToken', credentialData, nodeData);
        if (!apiToken) {
            throw new Error('No PagerDuty API token provided');
        }
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createPagerDutyTools)({
            actions,
            apiToken
        });
        return tools;
    }
}
module.exports = { nodeClass: PagerDuty_Tools };
//# sourceMappingURL=PagerDuty.js.map