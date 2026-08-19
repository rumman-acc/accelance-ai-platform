"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const utils_1 = require("../../../src/utils");
const modelLoader_1 = require("../../../src/modelLoader");
const FlowiseChatGoogleGenerativeAI_1 = require("./FlowiseChatGoogleGenerativeAI");
class GoogleGenerativeAI_ChatModels {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listModels() {
                return await (0, modelLoader_1.getModels)(modelLoader_1.MODEL_TYPE.CHAT, 'chatGoogleGenerativeAI');
            }
        };
        this.label = 'Google Gemini';
        this.name = 'chatGoogleGenerativeAI';
        this.version = 3.1;
        this.type = 'ChatGoogleGenerativeAI';
        this.icon = 'GoogleGemini.svg';
        this.category = 'Chat Models';
        this.description = 'Wrapper around Google Gemini large language models that use the Chat endpoint';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(FlowiseChatGoogleGenerativeAI_1.ChatGoogleGenerativeAI)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleGenerativeAI'],
            optional: false,
            description: 'Google Generative AI credential.'
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
                default: 'gemini-2.5-flash'
            },
            {
                label: 'Custom Model Name',
                name: 'customModelName',
                type: 'string',
                placeholder: 'gemini-1.5-pro-exp-0801',
                description: 'Custom model name to use. If provided, it will override the model selected',
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
                optional: true,
                additionalParams: true
            },
            {
                label: 'Allow Image Uploads',
                name: 'allowImageUploads',
                type: 'boolean',
                description: 'Allow image input. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.',
                default: false,
                optional: true
            },
            /** The thinkingLevel parameter, recommended for Gemini 3 models and onwards. */
            {
                label: 'Thinking Budget',
                name: 'thinkingBudget',
                type: 'number',
                description: 'Guides the number of thinking tokens. -1 for dynamic, 0 to disable, or positive integer (Gemini 2.5 models).',
                step: 1,
                optional: true,
                additionalParams: true,
                show: {
                    modelName: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
                }
            },
            {
                label: 'Thinking Level',
                name: 'thinkingLevel',
                type: 'options',
                description: 'Adjust the amount of reasoning effort based on the complexity of the user request',
                options: [
                    {
                        label: 'Low',
                        name: 'LOW'
                    },
                    {
                        label: 'Medium',
                        name: 'MEDIUM'
                    },
                    {
                        label: 'High',
                        name: 'HIGH'
                    }
                ],
                optional: true,
                additionalParams: true,
                show: {
                    modelName: ['gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview']
                }
            },
            {
                label: 'Max Output Tokens',
                name: 'maxOutputTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Next Highest Probability Tokens',
                name: 'topK',
                type: 'number',
                description: `Decode using top-k sampling: consider the set of top_k most probable tokens. Must be positive`,
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Safety Settings',
                name: 'safetySettings',
                type: 'array',
                description: 'Safety settings for the model. Refer to the <a href="https://ai.google.dev/gemini-api/docs/safety-settings">official guide</a> on how to use Safety Settings',
                array: [
                    {
                        label: 'Harm Category',
                        name: 'harmCategory',
                        type: 'options',
                        options: [
                            {
                                label: 'Dangerous',
                                name: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                                description: 'Promotes, facilitates, or encourages harmful acts.'
                            },
                            {
                                label: 'Harassment',
                                name: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
                                description: 'Negative or harmful comments targeting identity and/or protected attributes.'
                            },
                            {
                                label: 'Hate Speech',
                                name: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                                description: 'Content that is rude, disrespectful, or profane.'
                            },
                            {
                                label: 'Sexually Explicit',
                                name: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                                description: 'Contains references to sexual acts or other lewd content.'
                            },
                            {
                                label: 'Civic Integrity',
                                name: generative_ai_1.HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                                description: 'Election-related queries.'
                            }
                        ]
                    },
                    {
                        label: 'Harm Block Threshold',
                        name: 'harmBlockThreshold',
                        type: 'options',
                        options: [
                            {
                                label: 'None',
                                name: generative_ai_1.HarmBlockThreshold.BLOCK_NONE,
                                description: 'Always show regardless of probability of unsafe content'
                            },
                            {
                                label: 'Only High',
                                name: generative_ai_1.HarmBlockThreshold.BLOCK_ONLY_HIGH,
                                description: 'Block when high probability of unsafe content'
                            },
                            {
                                label: 'Medium and Above',
                                name: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                                description: 'Block when medium or high probability of unsafe content'
                            },
                            {
                                label: 'Low and Above',
                                name: generative_ai_1.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                                description: 'Block when low, medium or high probability of unsafe content'
                            },
                            {
                                label: 'Threshold Unspecified (Default Threshold)',
                                name: generative_ai_1.HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
                                description: 'Threshold is unspecified, block using default threshold'
                            }
                        ]
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                description: 'Base URL for the API. Leave empty to use the default.',
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiKey = (0, utils_1.getCredentialParam)('googleGenerativeAPIKey', credentialData, nodeData);
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const customModelName = nodeData.inputs?.customModelName;
        const maxOutputTokens = nodeData.inputs?.maxOutputTokens;
        const topP = nodeData.inputs?.topP;
        const topK = nodeData.inputs?.topK;
        const _safetySettings = nodeData.inputs?.safetySettings;
        const cache = nodeData.inputs?.cache;
        const streaming = nodeData.inputs?.streaming;
        const baseUrl = nodeData.inputs?.baseUrl;
        const thinkingBudget = nodeData.inputs?.thinkingBudget;
        const thinkingLevel = nodeData.inputs?.thinkingLevel;
        const allowImageUploads = nodeData.inputs?.allowImageUploads;
        const obj = {
            apiKey: apiKey,
            model: customModelName || modelName,
            streaming: streaming ?? true
        };
        // this extra metadata is needed, as langchain does not show the model name in the callbacks.
        obj.metadata = {
            fw_model_name: customModelName || modelName
        };
        if (maxOutputTokens)
            obj.maxOutputTokens = parseInt(maxOutputTokens, 10);
        if (topP)
            obj.topP = parseFloat(topP);
        if (topK)
            obj.topK = parseFloat(topK);
        if (cache)
            obj.cache = cache;
        if (temperature)
            obj.temperature = parseFloat(temperature);
        if (baseUrl)
            obj.baseUrl = baseUrl;
        if (thinkingLevel) {
            obj.thinkingConfig = {
                thinkingLevel: thinkingLevel,
                includeThoughts: true
            };
        }
        else if (thinkingBudget) {
            obj.thinkingConfig = {
                thinkingBudget: parseInt(thinkingBudget, 10),
                includeThoughts: true
            };
        }
        let safetySettings = [];
        if (_safetySettings) {
            try {
                const parsedSafetySettings = typeof _safetySettings === 'string' ? JSON.parse(_safetySettings) : _safetySettings;
                if (Array.isArray(parsedSafetySettings)) {
                    const validSettings = parsedSafetySettings
                        .filter((setting) => setting.harmCategory && setting.harmBlockThreshold)
                        .map((setting) => ({
                        category: setting.harmCategory,
                        threshold: setting.harmBlockThreshold
                    }));
                    // Remove duplicates by keeping only the first occurrence of each harm category
                    const seenCategories = new Set();
                    safetySettings = validSettings.filter((setting) => {
                        if (seenCategories.has(setting.category)) {
                            return false;
                        }
                        seenCategories.add(setting.category);
                        return true;
                    });
                }
            }
            catch (error) {
                console.warn('Failed to parse safety settings:', error);
            }
        }
        if (safetySettings.length > 0)
            obj.safetySettings = safetySettings;
        const multiModalOption = {
            image: {
                allowImageUploads: allowImageUploads ?? false
            }
        };
        const model = new FlowiseChatGoogleGenerativeAI_1.ChatGoogleGenerativeAI(nodeData.id, obj);
        model.setMultiModalOption(multiModalOption);
        return model;
    }
}
module.exports = { nodeClass: GoogleGenerativeAI_ChatModels };
//# sourceMappingURL=ChatGoogleGenerativeAI.js.map