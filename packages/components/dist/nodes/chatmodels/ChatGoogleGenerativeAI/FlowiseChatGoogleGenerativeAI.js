"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGoogleGenerativeAI = exports._FUNCTION_CALL_THOUGHT_SIGNATURES_MAP_KEY = void 0;
exports.sanitizeSchemaForGemini = sanitizeSchemaForGemini;
exports.getMessageAuthor = getMessageAuthor;
exports.convertAuthorToRole = convertAuthorToRole;
exports.convertMessageContentToParts = convertMessageContentToParts;
exports.convertBaseMessagesToContent = convertBaseMessagesToContent;
exports.convertUsageMetadata = convertUsageMetadata;
exports.mapGenerateContentResultToChatResult = mapGenerateContentResultToChatResult;
exports.convertResponseContentToChatGenerationChunk = convertResponseContentToChatGenerationChunk;
const google_genai_1 = require("@langchain/google-genai");
const outputs_1 = require("@langchain/core/outputs");
const messages_1 = require("@langchain/core/messages");
const uuid_1 = require("uuid");
// ============================================================================
// Constants
// ============================================================================
exports._FUNCTION_CALL_THOUGHT_SIGNATURES_MAP_KEY = '__gemini_function_call_thought_signatures__';
const DUMMY_SIGNATURE = 'ErYCCrMCAdHtim9kOoOkrPiCNVsmlpMIKd7ZMxgiFbVQOkgp7nlLcDMzVsZwIzvuT7nQROivoXA72ccC2lSDvR0Gh7dkWaGuj7ctv6t7ZceHnecx0QYa+ix8tYpRfjhyWozQ49lWiws6+YGjCt10KRTyWsZ2h6O7iHTYJwKIRwGUHRKy/qK/6kFxJm5ML00gLq4D8s5Z6DBpp2ZlR+uF4G8jJgeWQgyHWVdx2wGYElaceVAc66tZdPQRdOHpWtgYSI1YdaXgVI8KHY3/EfNc2YqqMIulvkDBAnuMhkAjV9xmBa54Tq+ih3Im4+r3DzqhGqYdsSkhS0kZMwte4Hjs65dZzCw9lANxIqYi1DJ639WNPYihp/DCJCos7o+/EeSPJaio5sgWDyUnMGkY1atsJZ+m7pj7DD5tvQ==';
// ============================================================================
// Utility Functions for Message Conversion
// ============================================================================
// Keywords Gemini's function-calling schema validator rejects outright (400,
// "Unknown name ... Cannot find field") even though they're standard JSON
// Schema and every other supported provider accepts them.
const GEMINI_UNSUPPORTED_SCHEMA_KEYS = new Set(['exclusiveMinimum', 'exclusiveMaximum', '$schema']);
function sanitizeSchemaForGemini(schema) {
    if (Array.isArray(schema)) {
        return schema.map((item) => sanitizeSchemaForGemini(item));
    }
    if (schema && typeof schema === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(schema)) {
            if (GEMINI_UNSUPPORTED_SCHEMA_KEYS.has(key))
                continue;
            result[key] = sanitizeSchemaForGemini(value);
        }
        return result;
    }
    return schema;
}
function getMessageAuthor(message) {
    if (messages_1.ChatMessage.isInstance(message)) {
        return message.role;
    }
    return message.type;
}
/**
 * Maps a message type to a Google Generative AI chat author.
 * Returns 'user' as default instead of throwing error
 * https://github.com/FlowiseAI/Flowise/issues/4743
 */
function convertAuthorToRole(author) {
    switch (author) {
        case 'supervisor':
        case 'ai':
        case 'model':
            return 'model';
        case 'system':
            return 'system';
        case 'human':
            return 'user';
        case 'tool':
        case 'function':
            return 'function';
        default:
            return 'user';
    }
}
function messageContentMedia(content) {
    if ('mimeType' in content && 'data' in content) {
        return {
            inlineData: {
                mimeType: content.mimeType,
                data: content.data
            }
        };
    }
    if ('mimeType' in content && 'fileUri' in content) {
        return {
            fileData: {
                mimeType: content.mimeType,
                fileUri: content.fileUri
            }
        };
    }
    throw new Error('Invalid media content');
}
function inferToolNameFromPreviousMessages(message, previousMessages) {
    return previousMessages
        .map((msg) => {
        if (messages_1.AIMessage.isInstance(msg)) {
            return msg.tool_calls ?? [];
        }
        return [];
    })
        .flat()
        .find((toolCall) => {
        return toolCall.id === message.tool_call_id;
    })?.name;
}
function _getStandardContentBlockConverter(isMultimodalModel) {
    const standardContentBlockConverter = {
        providerName: 'Google Gemini',
        fromStandardTextBlock(block) {
            return {
                text: block.text
            };
        },
        fromStandardImageBlock(block) {
            if (!isMultimodalModel) {
                throw new Error('This model does not support images');
            }
            if (block.source_type === 'url') {
                const data = (0, messages_1.parseBase64DataUrl)({ dataUrl: block.url });
                if (data) {
                    return {
                        inlineData: {
                            mimeType: data.mime_type,
                            data: data.data
                        }
                    };
                }
                else {
                    return {
                        fileData: {
                            mimeType: block.mime_type ?? '',
                            fileUri: block.url
                        }
                    };
                }
            }
            if (block.source_type === 'base64') {
                return {
                    inlineData: {
                        mimeType: block.mime_type ?? '',
                        data: block.data
                    }
                };
            }
            throw new Error(`Unsupported source type: ${block.source_type}`);
        },
        fromStandardAudioBlock(block) {
            if (!isMultimodalModel) {
                throw new Error('This model does not support audio');
            }
            if (block.source_type === 'url') {
                const data = (0, messages_1.parseBase64DataUrl)({ dataUrl: block.url });
                if (data) {
                    return {
                        inlineData: {
                            mimeType: data.mime_type,
                            data: data.data
                        }
                    };
                }
                else {
                    return {
                        fileData: {
                            mimeType: block.mime_type ?? '',
                            fileUri: block.url
                        }
                    };
                }
            }
            if (block.source_type === 'base64') {
                return {
                    inlineData: {
                        mimeType: block.mime_type ?? '',
                        data: block.data
                    }
                };
            }
            throw new Error(`Unsupported source type: ${block.source_type}`);
        },
        fromStandardFileBlock(block) {
            if (!isMultimodalModel) {
                throw new Error('This model does not support files');
            }
            if (block.source_type === 'text') {
                return {
                    text: block.text
                };
            }
            if (block.source_type === 'url') {
                const data = (0, messages_1.parseBase64DataUrl)({ dataUrl: block.url });
                if (data) {
                    return {
                        inlineData: {
                            mimeType: data.mime_type,
                            data: data.data
                        }
                    };
                }
                else {
                    return {
                        fileData: {
                            mimeType: block.mime_type ?? '',
                            fileUri: block.url
                        }
                    };
                }
            }
            if (block.source_type === 'base64') {
                return {
                    inlineData: {
                        mimeType: block.mime_type ?? '',
                        data: block.data
                    }
                };
            }
            throw new Error(`Unsupported source type: ${block.source_type}`);
        }
    };
    return standardContentBlockConverter;
}
function _convertLangChainContentToPart(content, isMultimodalModel) {
    if ((0, messages_1.isDataContentBlock)(content)) {
        return (0, messages_1.convertToProviderContentBlock)(content, _getStandardContentBlockConverter(isMultimodalModel));
    }
    if (content.type === 'text') {
        return { text: content.text };
    }
    else if (content.type === 'executableCode') {
        return { executableCode: content.executableCode };
    }
    else if (content.type === 'codeExecutionResult') {
        return { codeExecutionResult: content.codeExecutionResult };
    }
    else if (content.type === 'image_url') {
        if (!isMultimodalModel) {
            throw new Error(`This model does not support images`);
        }
        let source;
        if (typeof content.image_url === 'string') {
            source = content.image_url;
        }
        else if (typeof content.image_url === 'object' && 'url' in content.image_url) {
            source = content.image_url.url;
        }
        else {
            throw new Error('Please provide image as base64 encoded data URL');
        }
        const [dm, data] = source.split(',');
        if (!dm.startsWith('data:')) {
            throw new Error('Please provide image as base64 encoded data URL');
        }
        const [mimeType, encoding] = dm.replace(/^data:/, '').split(';');
        if (encoding !== 'base64') {
            throw new Error('Please provide image as base64 encoded data URL');
        }
        return {
            inlineData: {
                data,
                mimeType
            }
        };
    }
    else if (content.type === 'media') {
        return messageContentMedia(content);
    }
    else if (content.type === 'tool_use') {
        return {
            functionCall: {
                name: content.name,
                args: content.input
            }
        };
    }
    else if (content.type === 'tool_call') {
        return {
            functionCall: {
                name: content.name,
                args: content.args
            }
        };
    }
    else if (content.type?.includes('/') &&
        content.type.split('/').length === 2 &&
        'data' in content &&
        typeof content.data === 'string') {
        return {
            inlineData: {
                mimeType: content.type,
                data: content.data
            }
        };
    }
    else if ('functionCall' in content) {
        return undefined;
    }
    else {
        if ('type' in content) {
            throw new Error(`Unknown content type ${content.type}`);
        }
        else {
            throw new Error(`Unknown content ${JSON.stringify(content)}`);
        }
    }
}
function convertMessageContentToParts(message, isMultimodalModel, previousMessages, model) {
    if (messages_1.ToolMessage.isInstance(message)) {
        const messageName = message.name ?? inferToolNameFromPreviousMessages(message, previousMessages);
        if (messageName === undefined) {
            throw new Error(`Google requires a tool name for each tool call response, and we could not infer a called tool name for ToolMessage "${message.id}" from your passed messages. Please populate a "name" field on that ToolMessage explicitly.`);
        }
        const result = Array.isArray(message.content)
            ? message.content
                .map((c) => _convertLangChainContentToPart(c, isMultimodalModel))
                .filter((p) => p !== undefined)
            : message.content;
        if (message.status === 'error') {
            return [
                {
                    functionResponse: {
                        name: messageName,
                        response: { error: { details: result } }
                    }
                }
            ];
        }
        return [
            {
                functionResponse: {
                    name: messageName,
                    response: { result }
                }
            }
        ];
    }
    let functionCalls = [];
    const messageParts = [];
    if (typeof message.content === 'string' && message.content) {
        messageParts.push({ text: message.content });
    }
    if (Array.isArray(message.content)) {
        messageParts.push(...message.content
            .map((c) => _convertLangChainContentToPart(c, isMultimodalModel))
            .filter((p) => p !== undefined));
    }
    const functionThoughtSignatures = message.additional_kwargs?.[exports._FUNCTION_CALL_THOUGHT_SIGNATURES_MAP_KEY];
    if (messages_1.AIMessage.isInstance(message) && message.tool_calls?.length) {
        functionCalls = message.tool_calls.map((tc) => {
            const thoughtSignature = (() => {
                if (tc.id) {
                    const signature = functionThoughtSignatures?.[tc.id];
                    if (signature) {
                        return signature;
                    }
                }
                if (model?.includes('gemini-3')) {
                    return DUMMY_SIGNATURE;
                }
                return '';
            })();
            return {
                functionCall: {
                    name: tc.name,
                    args: tc.args
                },
                ...(thoughtSignature ? { thoughtSignature } : {})
            };
        });
    }
    return [...messageParts, ...functionCalls];
}
function convertBaseMessagesToContent(messages, isMultimodalModel, convertSystemMessageToHumanContent = false, model) {
    return messages.reduce((acc, message, index) => {
        if (!messages_1.BaseMessage.isInstance(message)) {
            throw new Error('Unsupported message input');
        }
        const author = getMessageAuthor(message);
        if (author === 'system' && index !== 0) {
            throw new Error('System message should be the first one');
        }
        const role = convertAuthorToRole(author);
        const prevContent = acc.content[acc.content.length];
        if (!acc.mergeWithPreviousContent && prevContent && prevContent.role === role) {
            throw new Error('Google Generative AI requires alternate messages between authors');
        }
        const parts = convertMessageContentToParts(message, isMultimodalModel, messages.slice(0, index), model);
        if (acc.mergeWithPreviousContent) {
            const prevContent = acc.content[acc.content.length - 1];
            if (!prevContent) {
                throw new Error('There was a problem parsing your system message. Please try a prompt without one.');
            }
            prevContent.parts.push(...parts);
            return {
                mergeWithPreviousContent: false,
                content: acc.content
            };
        }
        let actualRole = role;
        if (actualRole === 'function' || (actualRole === 'system' && !convertSystemMessageToHumanContent)) {
            actualRole = 'user';
        }
        const content = {
            role: actualRole,
            parts
        };
        return {
            mergeWithPreviousContent: author === 'system' && !convertSystemMessageToHumanContent,
            content: [...acc.content, content]
        };
    }, { content: [], mergeWithPreviousContent: false }).content;
}
// ============================================================================
// Usage Metadata Conversion
// ============================================================================
function convertUsageMetadata(usageMetadata) {
    const output = {
        input_tokens: usageMetadata?.promptTokenCount ?? 0,
        output_tokens: usageMetadata?.candidatesTokenCount ?? 0,
        total_tokens: usageMetadata?.totalTokenCount ?? 0
    };
    if (usageMetadata?.cachedContentTokenCount) {
        output.input_token_details ?? (output.input_token_details = {});
        output.input_token_details.cache_read = usageMetadata.cachedContentTokenCount;
    }
    return output;
}
// ============================================================================
// Response Mapping Functions (with inlineData extraction)
// ============================================================================
function mapGenerateContentResultToChatResult(response, extra) {
    // if rejected or error, return empty generations with reason in filters
    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0]) {
        return {
            generations: [],
            llmOutput: {
                filters: response.promptFeedback
            }
        };
    }
    const [candidate] = response.candidates;
    const { content: candidateContent, ...generationInfo } = candidate;
    // Extract function calls with IDs
    const functionCalls = candidateContent.parts?.reduce((acc, p) => {
        if ('functionCall' in p && p.functionCall) {
            acc.push({
                ...p,
                id: 'id' in p.functionCall && typeof p.functionCall.id === 'string' ? p.functionCall.id : (0, uuid_1.v4)()
            });
        }
        return acc;
    }, []);
    let content;
    const inlineDataItems = [];
    const parts = candidateContent?.parts;
    if (Array.isArray(parts) && parts.length === 1 && 'text' in parts[0] && parts[0].text && !parts[0].thought) {
        content = parts[0].text;
    }
    else if (Array.isArray(parts) && parts.length > 0) {
        content = parts.map((p) => {
            if (p.thought && 'text' in p && p.text) {
                return {
                    type: 'thinking',
                    thinking: p.text,
                    ...(p.thoughtSignature ? { signature: p.thoughtSignature } : {})
                };
            }
            else if ('text' in p) {
                return {
                    type: 'text',
                    text: p.text
                };
            }
            else if ('inlineData' in p && p.inlineData) {
                // Extract inline data (e.g., generated images) for processing
                inlineDataItems.push({
                    type: 'gemini_inline_data',
                    mimeType: p.inlineData.mimeType,
                    data: p.inlineData.data
                });
                return {
                    type: 'inlineData',
                    inlineData: p.inlineData
                };
            }
            else if ('functionCall' in p) {
                return {
                    type: 'functionCall',
                    functionCall: p.functionCall
                };
            }
            else if ('functionResponse' in p) {
                return {
                    type: 'functionResponse',
                    functionResponse: p.functionResponse
                };
            }
            else if ('fileData' in p) {
                return {
                    type: 'fileData',
                    fileData: p.fileData
                };
            }
            else if ('executableCode' in p) {
                return {
                    type: 'executableCode',
                    executableCode: p.executableCode
                };
            }
            else if ('codeExecutionResult' in p) {
                return {
                    type: 'codeExecutionResult',
                    codeExecutionResult: p.codeExecutionResult
                };
            }
            return p;
        });
    }
    else {
        content = [];
    }
    // Extract thought signatures from function calls
    const functionThoughtSignatures = functionCalls?.reduce((acc, fc) => {
        if ('thoughtSignature' in fc && typeof fc.thoughtSignature === 'string') {
            acc[fc.id] = fc.thoughtSignature;
        }
        return acc;
    }, {});
    let text = '';
    if (typeof content === 'string') {
        text = content;
    }
    else if (Array.isArray(content) && content.length > 0) {
        const block = content.find((b) => 'text' in b);
        text = block?.text ?? text;
    }
    // Build response_metadata with inline data if present
    const response_metadata = {};
    if (inlineDataItems.length > 0) {
        response_metadata.inlineData = inlineDataItems;
    }
    const generation = {
        text,
        message: new messages_1.AIMessage({
            content: content ?? '',
            tool_calls: functionCalls?.map((fc) => ({
                type: 'tool_call',
                id: fc.id,
                name: fc.functionCall.name,
                args: fc.functionCall.args
            })),
            additional_kwargs: {
                ...generationInfo,
                [exports._FUNCTION_CALL_THOUGHT_SIGNATURES_MAP_KEY]: functionThoughtSignatures
            },
            usage_metadata: extra?.usageMetadata,
            response_metadata: Object.keys(response_metadata).length > 0 ? response_metadata : undefined
        }),
        generationInfo
    };
    return {
        generations: [generation],
        llmOutput: {
            tokenUsage: {
                promptTokens: extra?.usageMetadata?.input_tokens,
                completionTokens: extra?.usageMetadata?.output_tokens,
                totalTokens: extra?.usageMetadata?.total_tokens
            }
        }
    };
}
function convertResponseContentToChatGenerationChunk(response, extra) {
    if (!response.candidates || response.candidates.length === 0) {
        return null;
    }
    const [candidate] = response.candidates;
    const { content: candidateContent, ...generationInfo } = candidate;
    // Extract function calls with IDs
    const functionCalls = candidateContent.parts?.reduce((acc, p) => {
        if ('functionCall' in p && p.functionCall) {
            acc.push({
                ...p,
                id: 'id' in p.functionCall && typeof p.functionCall.id === 'string' ? p.functionCall.id : (0, uuid_1.v4)()
            });
        }
        return acc;
    }, []);
    let content;
    const inlineDataItems = [];
    const streamParts = candidateContent?.parts;
    // Checks if all parts are plain text (no thought flags). If so, join as string.
    if (Array.isArray(streamParts) && streamParts.every((p) => 'text' in p && !p.thought)) {
        content = streamParts.map((p) => p.text).join('');
    }
    else if (Array.isArray(streamParts)) {
        content = streamParts.map((p) => {
            if (p.thought && 'text' in p && p.text) {
                return {
                    type: 'thinking',
                    thinking: p.text,
                    ...(p.thoughtSignature ? { signature: p.thoughtSignature } : {})
                };
            }
            else if ('text' in p) {
                return {
                    type: 'text',
                    text: p.text
                };
            }
            else if ('inlineData' in p && p.inlineData) {
                // Extract inline data for streaming responses
                inlineDataItems.push({
                    type: 'gemini_inline_data',
                    mimeType: p.inlineData.mimeType,
                    data: p.inlineData.data
                });
                return {
                    type: 'inlineData',
                    inlineData: p.inlineData
                };
            }
            else if ('functionCall' in p) {
                return {
                    type: 'functionCall',
                    functionCall: p.functionCall
                };
            }
            else if ('functionResponse' in p) {
                return {
                    type: 'functionResponse',
                    functionResponse: p.functionResponse
                };
            }
            else if ('fileData' in p) {
                return {
                    type: 'fileData',
                    fileData: p.fileData
                };
            }
            else if ('executableCode' in p) {
                return {
                    type: 'executableCode',
                    executableCode: p.executableCode
                };
            }
            else if ('codeExecutionResult' in p) {
                return {
                    type: 'codeExecutionResult',
                    codeExecutionResult: p.codeExecutionResult
                };
            }
            return p;
        });
    }
    else {
        content = [];
    }
    let text = '';
    if (content && typeof content === 'string') {
        text = content;
    }
    else if (Array.isArray(content)) {
        const block = content.find((b) => 'text' in b);
        text = block?.text ?? '';
    }
    const toolCallChunks = [];
    if (functionCalls) {
        toolCallChunks.push(...functionCalls.map((fc) => ({
            type: 'tool_call_chunk',
            id: fc.id,
            name: fc.functionCall.name,
            args: JSON.stringify(fc.functionCall.args)
        })));
    }
    // Extract thought signatures from function calls
    const functionThoughtSignatures = functionCalls?.reduce((acc, fc) => {
        if ('thoughtSignature' in fc && typeof fc.thoughtSignature === 'string') {
            acc[fc.id] = fc.thoughtSignature;
        }
        return acc;
    }, {});
    // Build response_metadata with inline data if present
    const response_metadata = {
        model_provider: 'google-genai'
    };
    if (inlineDataItems.length > 0) {
        response_metadata.inlineData = inlineDataItems;
    }
    return new outputs_1.ChatGenerationChunk({
        text,
        message: new messages_1.AIMessageChunk({
            content: content || '',
            name: !candidateContent ? undefined : candidateContent.role,
            tool_call_chunks: toolCallChunks,
            additional_kwargs: {
                [exports._FUNCTION_CALL_THOUGHT_SIGNATURES_MAP_KEY]: functionThoughtSignatures
            },
            response_metadata,
            usage_metadata: extra.usageMetadata
        }),
        generationInfo
    });
}
// ============================================================================
// Extended ChatGoogleGenerativeAI Class
// ============================================================================
class ChatGoogleGenerativeAI extends google_genai_1.ChatGoogleGenerativeAI {
    constructor(id, fields) {
        super(fields);
        this.id = id;
        this.configuredModel = fields?.model ?? '';
        this.configuredMaxToken = fields?.maxOutputTokens;
    }
    /**
     * Override bindTools to sanitize each tool's JSON schema before Gemini's
     * function-calling API sees it. Gemini's schema validator is a stricter
     * subset of standard JSON Schema — it rejects keywords other providers
     * (OpenAI, Anthropic) accept without issue, notably `exclusiveMinimum`/
     * `exclusiveMaximum` (which Zod's `.positive()`/`.negative()` compile to)
     * and the `$schema` metadata key, failing the whole tool-bound request
     * with a 400 rather than just ignoring the unknown field. This affects
     * any MCP or other externally-defined tool schema, not just one flow, so
     * fixing it once here benefits every agent that binds tools to Gemini.
     */
    bindTools(tools, kwargs) {
        const sanitizedTools = tools.map((tool) => {
            if (tool && typeof tool === 'object' && tool.schema && typeof tool.schema === 'object') {
                return { ...tool, schema: sanitizeSchemaForGemini(tool.schema) };
            }
            return tool;
        });
        return super.bindTools(sanitizedTools, kwargs);
    }
    /**
     * Override _generate to use custom response mapper that extracts inlineData
     */
    async _generate(messages, options, runManager) {
        options.signal?.throwIfAborted();
        const prompt = convertBaseMessagesToContent(messages, this._isMultimodalModel, this.useSystemInstruction, this.model);
        // Handle system instruction
        let actualPrompt = prompt;
        if (prompt[0]?.role === 'system') {
            const [systemInstruction] = prompt;
            this.client.systemInstruction = systemInstruction;
            actualPrompt = prompt.slice(1);
        }
        // Get tools and other params
        const parameters = this.invocationParams(options);
        // Check if streaming is enabled
        if (this.streaming) {
            const tokenUsage = {};
            const stream = this._streamResponseChunks(messages, options, runManager);
            const finalChunks = [];
            for await (const chunk of stream) {
                const index = chunk.generationInfo?.completion ?? 0;
                if (finalChunks[index] === undefined) {
                    finalChunks[index] = chunk;
                }
                else {
                    finalChunks[index] = finalChunks[index].concat(chunk);
                }
            }
            const generations = finalChunks.filter((c) => c !== undefined);
            return { generations, llmOutput: { estimatedTokenUsage: tokenUsage } };
        }
        // Non-streaming: make the API call directly
        const res = await this.completionWithRetry({
            ...parameters,
            contents: actualPrompt
        });
        let usageMetadata;
        if ('usageMetadata' in res.response) {
            usageMetadata = convertUsageMetadata(res.response.usageMetadata);
        }
        const generationResult = mapGenerateContentResultToChatResult(res.response, {
            usageMetadata
        });
        // may not have generations in output if there was a refusal for safety reasons, malformed function call, etc.
        if (generationResult.generations?.length > 0) {
            await runManager?.handleLLMNewToken(generationResult.generations[0]?.text ?? '');
        }
        return generationResult;
    }
    /**
     * Override streaming method to use custom chunk converter that extracts inlineData
     */
    async *_streamResponseChunks(messages, options, runManager) {
        const prompt = convertBaseMessagesToContent(messages, this._isMultimodalModel, this.useSystemInstruction, this.model);
        let actualPrompt = prompt;
        if (prompt[0]?.role === 'system') {
            const [systemInstruction] = prompt;
            this.client.systemInstruction = systemInstruction;
            actualPrompt = prompt.slice(1);
        }
        const parameters = this.invocationParams(options);
        const request = {
            ...parameters,
            contents: actualPrompt
        };
        const stream = await this.caller.callWithOptions({ signal: options?.signal }, async () => {
            const { stream } = await this.client.generateContentStream(request, {
                signal: options?.signal
            });
            return stream;
        });
        let usageMetadata;
        // Keep prior cumulative counts for calculating token deltas while streaming
        let prevPromptTokenCount = 0;
        let prevCandidatesTokenCount = 0;
        let prevTotalTokenCount = 0;
        let index = 0;
        for await (const response of stream) {
            if (options.signal?.aborted) {
                return;
            }
            if ('usageMetadata' in response &&
                response.usageMetadata !== undefined &&
                this.streamUsage !== false &&
                options.streamUsage !== false) {
                usageMetadata = convertUsageMetadata(response.usageMetadata);
                // Under the hood, LangChain combines the prompt tokens. Google returns the updated
                // total each time, so we need to find the difference between the tokens.
                const newPromptTokenCount = response.usageMetadata.promptTokenCount ?? 0;
                usageMetadata.input_tokens = Math.max(0, newPromptTokenCount - prevPromptTokenCount);
                prevPromptTokenCount = newPromptTokenCount;
                const newCandidatesTokenCount = response.usageMetadata.candidatesTokenCount ?? 0;
                usageMetadata.output_tokens = Math.max(0, newCandidatesTokenCount - prevCandidatesTokenCount);
                prevCandidatesTokenCount = newCandidatesTokenCount;
                const newTotalTokenCount = response.usageMetadata.totalTokenCount ?? 0;
                usageMetadata.total_tokens = Math.max(0, newTotalTokenCount - prevTotalTokenCount);
                prevTotalTokenCount = newTotalTokenCount;
            }
            const chunk = convertResponseContentToChatGenerationChunk(response, {
                usageMetadata,
                index
            });
            index += 1;
            if (!chunk) {
                continue;
            }
            yield chunk;
            await runManager?.handleLLMNewToken(chunk.text ?? '');
        }
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption;
    }
}
exports.ChatGoogleGenerativeAI = ChatGoogleGenerativeAI;
//# sourceMappingURL=FlowiseChatGoogleGenerativeAI.js.map