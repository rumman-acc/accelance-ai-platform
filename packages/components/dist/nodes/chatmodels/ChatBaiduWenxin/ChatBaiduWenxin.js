"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baidu_qianfan_1 = require("@langchain/baidu-qianfan");
const modelLoader_1 = require("../../../src/modelLoader");
const utils_1 = require("../../../src/utils");
class ChatBaiduWenxin_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'chatBaiduWenxin');
            }
        };
        this.label = 'Baidu Wenxin';
        this.name = 'chatBaiduWenxin';
        this.version = 3.0;
        this.type = 'ChatBaiduWenxin';
        this.icon = 'baiduwenxin.svg';
        this.category = 'Chat Models';
        this.description = 'Wrapper around BaiduWenxin Chat Endpoints';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(baidu_qianfan_1.ChatBaiduQianfan)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['baiduQianfanApi']
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
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'ernie-4.5-8k-preview'
            },
            {
                label: 'Custom Model Name',
                name: 'customModelName',
                type: 'string',
                placeholder: 'ernie-speed-128k',
                description: 'Custom model name to use. If provided, it will override the selected model.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                description: 'Nucleus sampling. The model considers tokens whose cumulative probability mass reaches this value.',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Penalty Score',
                name: 'penaltyScore',
                type: 'number',
                description: 'Penalizes repeated tokens according to frequency. Baidu Qianfan accepts values from 1.0 to 2.0.',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'User ID',
                name: 'userId',
                type: 'string',
                description: 'Optional unique identifier for the end user making the request.',
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const cache = nodeData.inputs?.cache;
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const customModelName = nodeData.inputs?.customModelName;
        const streaming = nodeData.inputs?.streaming;
        const topP = nodeData.inputs?.topP;
        const penaltyScore = nodeData.inputs?.penaltyScore;
        const userId = nodeData.inputs?.userId;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const qianfanAccessKey = (0, utils_1.getCredentialParam)('qianfanAccessKey', credentialData, nodeData);
        const qianfanSecretKey = (0, utils_1.getCredentialParam)('qianfanSecretKey', credentialData, nodeData);
        const obj = {
            streaming: streaming ?? true,
            qianfanAccessKey,
            qianfanSecretKey,
            modelName: customModelName || modelName,
            temperature: temperature ? parseFloat(temperature) : undefined
        };
        if (topP)
            obj.topP = parseFloat(topP);
        if (penaltyScore)
            obj.penaltyScore = parseFloat(penaltyScore);
        if (userId)
            obj.userId = userId;
        if (cache)
            obj.cache = cache;
        const model = new baidu_qianfan_1.ChatBaiduQianfan(obj);
        return model;
    }
}
module.exports = { nodeClass: ChatBaiduWenxin_ChatModels };
//# sourceMappingURL=ChatBaiduWenxin.js.map