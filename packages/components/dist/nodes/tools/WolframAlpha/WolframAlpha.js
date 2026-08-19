"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wolframalpha_1 = require("@langchain/community/tools/wolframalpha");
const utils_1 = require("../../../src/utils");
class WolframAlpha_Tools {
    constructor() {
        this.label = 'WolframAlpha';
        this.name = 'wolframAlpha';
        this.version = 1.0;
        this.type = 'WolframAlpha';
        this.icon = 'wolframalpha.png';
        this.category = 'Tools';
        this.description = 'Wrapper around WolframAlpha - a powerful computational knowledge engine';
        this.inputs = [];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['wolframAlphaAppId']
        };
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(wolframalpha_1.WolframAlphaTool)];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const wolframAlphaAppId = (0, utils_1.getCredentialParam)('wolframAlphaAppId', credentialData, nodeData);
        return new wolframalpha_1.WolframAlphaTool({
            appid: wolframAlphaAppId
        });
    }
}
module.exports = { nodeClass: WolframAlpha_Tools };
//# sourceMappingURL=WolframAlpha.js.map