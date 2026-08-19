"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const fireworks_1 = require("@langchain/community/llms/fireworks");
class Fireworks_LLMs {
    constructor() {
        this.label = 'Fireworks';
        this.name = 'fireworks';
        this.version = 1.0;
        this.type = 'Fireworks';
        this.icon = 'fireworks.png';
        this.category = 'LLMs';
        this.description = 'Wrapper around Fireworks API for large language models';
        this.badge = 'DEPRECATING';
        this.deprecateMessage = 'Use Fireworks Chat Models instead';
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(fireworks_1.Fireworks)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['fireworksApi']
        };
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                default: 'accounts/fireworks/models/llama-v3-70b-instruct-hf',
                description: 'For more details see https://fireworks.ai/models',
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const cache = nodeData.inputs?.cache;
        const modelName = nodeData.inputs?.modelName;
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const fireworksKey = (0, src_1.getCredentialParam)('fireworksApiKey', credentialData, nodeData);
        const obj = {
            fireworksApiKey: fireworksKey,
            modelName: modelName
        };
        if (cache)
            obj.cache = cache;
        const fireworks = new fireworks_1.Fireworks(obj);
        return fireworks;
    }
}
module.exports = { nodeClass: Fireworks_LLMs };
//# sourceMappingURL=Fireworks.js.map