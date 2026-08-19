import { BaseChatModel, type BaseChatModelParams } from '@langchain/core/language_models/chat_models';
import { BaseMessage } from '@langchain/core/messages';
import { ChatResult, ChatGenerationChunk } from '@langchain/core/outputs';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import { IVisionChatModal, IMultiModalOption } from '../../../src';
/**
 * Request format used when calling Bedrock's InvokeModel API for imported models.
 *
 * - 'bedrock-completion': Uses { prompt, max_gen_len, temperature } request shape.
 *   Response: { generation, stop_reason }. For models without a chat template (e.g. GPTBigCode).
 * - 'openai-chat-completion': Uses { messages, max_tokens, temperature } request shape.
 *   Response: { choices: [{ message }], usage }. For models with chat support (Llama, Qwen, etc.).
 *
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/invoke-imported-model.html
 */
export type ImportedModelFormat = 'bedrock-completion' | 'openai-chat-completion';
export interface BedrockImportedChatInput extends BaseChatModelParams {
    region: string;
    modelId: string;
    format: ImportedModelFormat;
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
    };
}
interface ImportedModelInfo {
    instructSupported?: boolean;
    modelArchitecture?: string;
    supportedFormats?: string[];
}
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
export declare function getImportedModelInfo(modelId: string, region: string, credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}): Promise<ImportedModelInfo>;
/**
 * Selects the best request format based on the model's supported formats.
 * Prefers OpenAIChatCompletion (structured messages, tool_calls, token usage)
 * over BedrockCompletion (raw prompt string). Falls back to openai-chat-completion
 * if no format info is available.
 */
export declare function detectFormat(supportedFormats?: string[]): ImportedModelFormat;
export declare function _resetModelInfoCache(): void;
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
export declare class BedrockImportedChat extends BaseChatModel implements IVisionChatModal {
    configuredModel: string;
    configuredMaxToken?: number;
    multiModalOption: IMultiModalOption;
    id: string;
    private region;
    private modelId;
    private format;
    private temperature;
    private maxTokens;
    private streamingEnabled;
    private credentials?;
    private client;
    constructor(id: string, fields: BedrockImportedChatInput);
    _llmType(): string;
    get callKeys(): string[];
    setMultiModalOption(multiModalOption: IMultiModalOption): void;
    _generate(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
    _streamResponseChunks(messages: BaseMessage[], _options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun): AsyncGenerator<ChatGenerationChunk>;
    private buildRequestBody;
    private buildBedrockCompletionBody;
    private buildOpenAIChatBody;
    convertMessagesToPrompt(messages: BaseMessage[]): string;
    convertMessagesToOpenAI(messages: BaseMessage[]): Array<Record<string, unknown>>;
    private convertMultiModalContent;
    private parseResponse;
    private parseBedrockCompletionResponse;
    private parseOpenAIChatResponse;
    private extractStreamChunkText;
    private normalizeError;
}
export {};
