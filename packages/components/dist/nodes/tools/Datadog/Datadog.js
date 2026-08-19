"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
class Datadog_Tools {
    constructor() {
        this.label = 'Datadog';
        this.name = 'datadogTool';
        this.version = 1.0;
        this.type = 'Datadog';
        this.icon = 'datadog.svg';
        this.category = 'Tools';
        this.description = 'Query metrics and manage Datadog monitors';
        this.baseClasses = [this.type, 'Tool'];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['datadogApi']
        };
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Monitors',
                        name: 'list_monitors'
                    },
                    {
                        label: 'Get Monitor',
                        name: 'get_monitor'
                    },
                    {
                        label: 'Create Monitor',
                        name: 'create_monitor'
                    },
                    {
                        label: 'Post Event',
                        name: 'post_event'
                    },
                    {
                        label: 'Query Metrics',
                        name: 'query_metrics'
                    }
                ]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData);
        const appKey = (0, utils_1.getCredentialParam)('appKey', credentialData, nodeData);
        const site = (0, utils_1.getCredentialParam)('site', credentialData, nodeData);
        const actions = (0, utils_1.convertMultiOptionsToStringArray)(nodeData.inputs?.actions);
        const tools = (0, core_1.createDatadogTools)({
            actions,
            apiKey,
            appKey,
            site
        });
        return tools;
    }
}
module.exports = { nodeClass: Datadog_Tools };
//# sourceMappingURL=Datadog.js.map