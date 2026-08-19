"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockImportedChat = void 0;
exports.getImportedModelInfo = getImportedModelInfo;
exports.detectFormat = detectFormat;
exports._resetModelInfoCache = _resetModelInfoCache;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
const outputs_1 = require("@langchain/core/outputs");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const _modelInfoCache = new Map();
/**
 * Fetches metadata and supported request formats for an imported Bedrock model.
 *
 * Two-step process:
 * 1. Calls GetImportedModel to retrieve instructSupported and modelArchitecture.
 * 2. Probes InvokeModel with an empty body — the resulting ValidationException
 *    lists the formats the model accepts (e.g. "ChatCompletionRequest, BedrockMetaCompletionRequest").
 *
 * Results are cached per modelId for the process lifetime.
 * Errors propagate directly — if the model doesn't exist, the caller gets the real Bedrock error.
 *
 * @see https://docs.aws.amazon.com/bedrock/latest/APIReference/API_GetImportedModel.html
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/invoke-imported-model.html
 */
async function getImportedModelInfo(modelId, region, credentials) {
    if (_modelInfoCache.has(modelId)) {
        return _modelInfoCache.get(modelId);
    }
    const info = {};
    // Step 1: GetImportedModel for metadata (instructSupported, modelArchitecture)
    const { BedrockClient, GetImportedModelCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-bedrock')));
    const client = new BedrockClient({
        region,
        ...(credentials && { credentials })
    });
    const resp = await client.send(new GetImportedModelCommand({ modelIdentifier: modelId }));
    info.instructSupported = resp.instructSupported;
    info.modelArchitecture = resp.modelArchitecture;
    // Step 2: Probe InvokeModel with an empty body to discover supported formats.
    // Bedrock returns a ValidationException whose message lists the formats, e.g.:
    // "Available for this model: ChatCompletionRequest, BedrockMetaCompletionRequest, ..."
    // This is a control-plane call that fails instantly — no inference cost.
    try {
        const runtimeClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region,
            ...(credentials && { credentials })
        });
        await runtimeClient.send(new client_bedrock_runtime_1.InvokeModelCommand({
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({})
        }));
    }
    catch (probeErr) {
        const msg = probeErr?.message ?? '';
        const match = msg.match(/Available for this model:\s*(.+?)(?:"|$)/);
        if (match) {
            info.supportedFormats = match[1].split(',').map((s) => s.trim().toLowerCase());
        }
        else if (msg.includes('prompt') && msg.includes('must be provided')) {
            // Model expects a prompt field (completion-style, no chat template)
            info.supportedFormats = ['completionrequest'];
        }
        else {
            throw probeErr;
        }
    }
    _modelInfoCache.set(modelId, info);
    return info;
}
/**
 * Selects the best request format based on the model's supported formats.
 * Prefers OpenAIChatCompletion (structured messages, tool_calls, token usage)
 * over BedrockCompletion (raw prompt string). Falls back to openai-chat-completion
 * if no format info is available.
 */
function detectFormat(supportedFormats) {
    if (!supportedFormats?.length) {
        return 'openai-chat-completion';
    }
    // Prefer OpenAI Chat if available — structured messages, tool_calls, token usage
    if (supportedFormats.some((f) => f.includes('chatcompletion'))) {
        return 'openai-chat-completion';
    }
    return 'bedrock-completion';
}
function _resetModelInfoCache() {
    _modelInfoCache.clear();
}
/**
 * LangChain-compatible chat model for Bedrock imported models that don't support
 * the Converse API (instructSupported: false).
 *
 * Uses InvokeModel / InvokeModelWithResponseStream instead of Converse / ConverseStream.
 * Supports two request formats (auto-detected at init time via getImportedModelInfo):
 * - OpenAIChatCompletion: messages array with tool_calls support
 * - BedrockCompletion: raw prompt string with max_gen_len
 *
 * This class is instantiated by AWSChatBedrock.init() when it detects an imported-model
 * ARN in the Custom Model ARN field. Users don't interact with it directly.
 *
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/invoke-imported-model.html
 * @see https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModel.html
 */
class BedrockImportedChat extends chat_models_1.BaseChatModel {
    constructor(id, fields) {
        super(fields);
        this.id = id;
        this.region = fields.region;
        this.modelId = fields.modelId;
        this.format = fields.format;
        this.temperature = fields.temperature ?? 0.7;
        this.maxTokens = fields.maxTokens ?? 200;
        this.streamingEnabled = fields.streaming ?? true;
        this.credentials = fields.credentials;
        this.configuredModel = fields.modelId;
        this.configuredMaxToken = fields.maxTokens;
        this.client = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: this.region,
            ...(this.credentials && { credentials: this.credentials })
        });
    }
    _llmType() {
        return 'bedrock-imported';
    }
    get callKeys() {
        return ['stop', 'signal', 'options'];
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption;
    }
    async _generate(messages, options, runManager) {
        if (this.streamingEnabled && runManager) {
            const generations = [];
            let fullText = '';
            for await (const chunk of this._streamResponseChunks(messages, options, runManager)) {
                generations.push(chunk);
                fullText += chunk.text;
            }
            return {
                generations: [{ text: fullText, message: new messages_1.AIMessage(fullText) }]
            };
        }
        const body = this.buildRequestBody(messages);
        try {
            const resp = await this.client.send(new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(body)
            }));
            if (resp.body == null)
                throw new Error('Response body is undefined');
            const decoded = JSON.parse(new TextDecoder().decode(resp.body));
            return this.parseResponse(decoded);
        }
        catch (err) {
            throw this.normalizeError(err);
        }
    }
    async *_streamResponseChunks(messages, _options, runManager) {
        const body = this.buildRequestBody(messages);
        try {
            const resp = await this.client.send(new client_bedrock_runtime_1.InvokeModelWithResponseStreamCommand({
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(body)
            }));
            if (!resp.body) {
                throw new Error('No response stream received from Bedrock');
            }
            for await (const event of resp.body) {
                if (event.chunk?.bytes) {
                    const decoded = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
                    const text = this.extractStreamChunkText(decoded);
                    if (text) {
                        const chunk = new outputs_1.ChatGenerationChunk({
                            text,
                            message: new messages_1.AIMessageChunk(text)
                        });
                        yield chunk;
                        await runManager?.handleLLMNewToken(text);
                    }
                }
            }
        }
        catch (err) {
            throw this.normalizeError(err);
        }
    }
    buildRequestBody(messages) {
        if (this.format === 'openai-chat-completion') {
            return this.buildOpenAIChatBody(messages);
        }
        return this.buildBedrockCompletionBody(messages);
    }
    buildBedrockCompletionBody(messages) {
        const prompt = this.convertMessagesToPrompt(messages);
        return {
            prompt,
            temperature: this.temperature,
            max_gen_len: this.maxTokens
        };
    }
    buildOpenAIChatBody(messages) {
        const openaiMessages = this.convertMessagesToOpenAI(messages);
        return {
            messages: openaiMessages,
            temperature: this.temperature,
            max_tokens: this.maxTokens
        };
    }
    convertMessagesToPrompt(messages) {
        const parts = [];
        for (const msg of messages) {
            const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            if (msg instanceof messages_1.SystemMessage) {
                parts.push(`${content}\n`);
            }
            else if (msg instanceof messages_1.HumanMessage) {
                parts.push(`User: ${content}`);
            }
            else if (msg instanceof messages_1.AIMessage) {
                parts.push(`Assistant: ${content}`);
            }
            else if (msg instanceof messages_1.ToolMessage) {
                parts.push(`Tool: ${content}`);
            }
            else {
                parts.push(content);
            }
        }
        parts.push('Assistant:');
        return parts.join('\n');
    }
    convertMessagesToOpenAI(messages) {
        return messages.map((msg) => {
            const content = typeof msg.content === 'string' ? msg.content : this.convertMultiModalContent(msg.content);
            if (msg instanceof messages_1.SystemMessage) {
                return { role: 'system', content };
            }
            if (msg instanceof messages_1.HumanMessage) {
                return { role: 'user', content };
            }
            if (msg instanceof messages_1.AIMessage) {
                const result = { role: 'assistant', content };
                if (msg.additional_kwargs?.tool_calls) {
                    result.tool_calls = msg.additional_kwargs.tool_calls;
                }
                return result;
            }
            if (msg instanceof messages_1.ToolMessage) {
                return {
                    role: 'tool',
                    content,
                    tool_call_id: msg.tool_call_id
                };
            }
            return { role: 'user', content };
        });
    }
    convertMultiModalContent(content) {
        if (!Array.isArray(content))
            return content;
        return content.map((part) => {
            if (part.type === 'image_url' && typeof part.image_url?.url === 'string') {
                const url = part.image_url.url;
                if (!url.startsWith('data:')) {
                    throw new Error('AWS Bedrock Imported models only support base64 data URLs for images, ' +
                        'not remote URLs. Convert the image to a data URL first.');
                }
                return part;
            }
            return part;
        });
    }
    parseResponse(decoded) {
        if (this.format === 'openai-chat-completion') {
            return this.parseOpenAIChatResponse(decoded);
        }
        return this.parseBedrockCompletionResponse(decoded);
    }
    parseBedrockCompletionResponse(decoded) {
        const text = decoded.completion ?? decoded.generation ?? '';
        return {
            generations: [{ text, message: new messages_1.AIMessage(text) }]
        };
    }
    parseOpenAIChatResponse(decoded) {
        const choices = decoded.choices;
        if (!choices?.length) {
            return { generations: [{ text: '', message: new messages_1.AIMessage('') }] };
        }
        const choice = choices[0];
        const message = choice.message ?? {};
        const text = message.content ?? '';
        const toolCalls = message.tool_calls;
        const aiMsg = new messages_1.AIMessage({
            content: text,
            additional_kwargs: toolCalls ? { tool_calls: toolCalls } : {}
        });
        return {
            generations: [{ text, message: aiMsg }],
            llmOutput: decoded.usage
                ? {
                    tokenUsage: {
                        promptTokens: decoded.usage.prompt_tokens,
                        completionTokens: decoded.usage.completion_tokens,
                        totalTokens: decoded.usage.total_tokens
                    }
                }
                : undefined
        };
    }
    extractStreamChunkText(decoded) {
        if (this.format === 'openai-chat-completion') {
            const choices = decoded.choices;
            if (!choices?.length)
                return '';
            const delta = choices[0].delta ?? {};
            return delta.content ?? '';
        }
        return decoded.completion ?? decoded.generation ?? decoded.outputText ?? '';
    }
    normalizeError(err) {
        if (!(err instanceof Error))
            return err;
        const msg = err.message ?? '';
        if (msg.includes('ModelNotReadyException') || msg.includes('not ready')) {
            return new Error(`The imported model is not ready to serve requests. ` +
                `This can happen shortly after import or if the model is being updated. ` +
                `Wait a few minutes and try again. Original error: ${msg}`);
        }
        if (msg.includes('ValidationException') && msg.includes('format')) {
            return new Error(`The request format may not match what this imported model expects. ` +
                `The auto-detected format is "${this.format}". ` +
                `Original error: ${msg}`);
        }
        if (msg.includes('ResourceNotFoundException')) {
            return new Error(`Model not found: "${this.modelId}". ` +
                `Verify the model ARN or ID is correct and the model exists in the "${this.region}" region. ` +
                `Original error: ${msg}`);
        }
        return err;
    }
}
exports.BedrockImportedChat = BedrockImportedChat;
//# sourceMappingURL=FlowiseAWSChatBedrockImported.js.map