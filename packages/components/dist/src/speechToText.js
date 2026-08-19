"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSpeechToText = void 0;
const utils_1 = require("./utils");
const openai_1 = require("@langchain/openai");
const assemblyai_1 = require("assemblyai");
const storageUtils_1 = require("./storageUtils");
const axios_1 = __importDefault(require("axios"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const SpeechToTextType = {
    OPENAI_WHISPER: 'openAIWhisper',
    ASSEMBLYAI_TRANSCRIBE: 'assemblyAiTranscribe',
    LOCALAI_STT: 'localAISTT',
    AZURE_COGNITIVE: 'azureCognitive',
    GROQ_WHISPER: 'groqWhisper'
};
const convertSpeechToText = async (upload, speechToTextConfig, options) => {
    if (speechToTextConfig) {
        const credentialId = speechToTextConfig.credentialId;
        const credentialData = await (0, utils_1.getCredentialData)(credentialId ?? '', options);
        const audio_file = await (0, storageUtils_1.getFileFromStorage)(upload.name, options.orgId, options.chatflowid, options.chatId);
        switch (speechToTextConfig.name) {
            case SpeechToTextType.OPENAI_WHISPER: {
                const openAIClientOptions = {
                    apiKey: credentialData.openAIApiKey
                };
                const openAIClient = new openai_1.OpenAIClient(openAIClientOptions);
                const file = await (0, openai_1.toFile)(audio_file, upload.name);
                const openAITranscription = await openAIClient.audio.transcriptions.create({
                    file: file,
                    model: 'whisper-1',
                    language: speechToTextConfig?.language,
                    temperature: speechToTextConfig?.temperature ? parseFloat(speechToTextConfig.temperature) : undefined,
                    prompt: speechToTextConfig?.prompt
                });
                if (openAITranscription?.text) {
                    return openAITranscription.text;
                }
                break;
            }
            case SpeechToTextType.ASSEMBLYAI_TRANSCRIBE: {
                const assemblyAIClient = new assemblyai_1.AssemblyAI({
                    apiKey: credentialData.assemblyAIApiKey
                });
                const params = {
                    audio: audio_file,
                    speaker_labels: false
                };
                const assemblyAITranscription = await assemblyAIClient.transcripts.transcribe(params);
                if (assemblyAITranscription?.text) {
                    return assemblyAITranscription.text;
                }
                break;
            }
            case SpeechToTextType.LOCALAI_STT: {
                const LocalAIClientOptions = {
                    apiKey: credentialData.localAIApiKey,
                    baseURL: speechToTextConfig?.baseUrl
                };
                const localAIClient = new openai_1.OpenAIClient(LocalAIClientOptions);
                const file = await (0, openai_1.toFile)(audio_file, upload.name);
                const localAITranscription = await localAIClient.audio.transcriptions.create({
                    file: file,
                    model: speechToTextConfig?.model || 'whisper-1',
                    language: speechToTextConfig?.language,
                    temperature: speechToTextConfig?.temperature ? parseFloat(speechToTextConfig.temperature) : undefined,
                    prompt: speechToTextConfig?.prompt
                });
                if (localAITranscription?.text) {
                    return localAITranscription.text;
                }
                break;
            }
            case SpeechToTextType.AZURE_COGNITIVE: {
                try {
                    const baseUrl = `https://${credentialData.serviceRegion}.cognitiveservices.azure.com/speechtotext/transcriptions:transcribe`;
                    const apiVersion = credentialData.apiVersion || '2024-05-15-preview';
                    const formData = new FormData();
                    const audioBlob = new Blob([new Uint8Array(audio_file)], { type: upload.type });
                    formData.append('audio', audioBlob, upload.name);
                    const channelsStr = speechToTextConfig.channels || '0,1';
                    const channels = channelsStr.split(',').map(Number);
                    const definition = {
                        locales: [speechToTextConfig.language || 'en-US'],
                        profanityFilterMode: speechToTextConfig.profanityFilterMode || 'Masked',
                        channels
                    };
                    formData.append('definition', JSON.stringify(definition));
                    const response = await axios_1.default.post(`${baseUrl}?api-version=${apiVersion}`, formData, {
                        headers: {
                            'Ocp-Apim-Subscription-Key': credentialData.azureSubscriptionKey,
                            Accept: 'application/json'
                        }
                    });
                    if (response.data && response.data.combinedPhrases.length > 0) {
                        return response.data.combinedPhrases[0]?.text || '';
                    }
                    return '';
                }
                catch (error) {
                    throw error.response?.data || error;
                }
            }
            case SpeechToTextType.GROQ_WHISPER: {
                const groqClient = new groq_sdk_1.default({
                    apiKey: credentialData.groqApiKey
                });
                const file = await (0, openai_1.toFile)(audio_file, upload.name);
                const groqTranscription = await groqClient.audio.transcriptions.create({
                    file,
                    model: speechToTextConfig?.model || 'whisper-large-v3',
                    language: speechToTextConfig?.language,
                    temperature: speechToTextConfig?.temperature ? parseFloat(speechToTextConfig.temperature) : undefined,
                    response_format: 'verbose_json'
                });
                if (groqTranscription?.text) {
                    return groqTranscription.text;
                }
                break;
            }
        }
    }
    else {
        throw new Error('Speech to text is not selected, but found a recorded audio file. Please fix the chain.');
    }
    return undefined;
};
exports.convertSpeechToText = convertSpeechToText;
//# sourceMappingURL=speechToText.js.map