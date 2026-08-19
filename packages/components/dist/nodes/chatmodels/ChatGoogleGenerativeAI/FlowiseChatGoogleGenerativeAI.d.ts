import { IMultiModalOption, IVisionChatModal } from '../../../src/Interface'
import { ChatGoogleGenerativeAI as LangchainChatGoogleGenerativeAI, GoogleGenerativeAIChatInput } from '@langchain/google-genai'
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
import { ChatResult, ChatGenerationChunk } from '@langchain/core/outputs'
import { EnhancedGenerateContentResponse, Content, Part, POSSIBLE_ROLES, GenerateContentResponse } from '@google/generative-ai'
import { BaseMessage, UsageMetadata } from '@langchain/core/messages'
export declare const _FUNCTION_CALL_THOUGHT_SIGNATURES_MAP_KEY = '__gemini_function_call_thought_signatures__'
export declare function sanitizeSchemaForGemini(schema: unknown): unknown
export declare function getMessageAuthor(message: BaseMessage): string
/**
 * Maps a message type to a Google Generative AI chat author.
 * Returns 'user' as default instead of throwing error
 * https://github.com/FlowiseAI/Flowise/issues/4743
 */
export declare function convertAuthorToRole(author: string): (typeof POSSIBLE_ROLES)[number]
export declare function convertMessageContentToParts(
    message: BaseMessage,
    isMultimodalModel: boolean,
    previousMessages: BaseMessage[],
    model?: string
): Part[]
export declare function convertBaseMessagesToContent(
    messages: BaseMessage[],
    isMultimodalModel: boolean,
    convertSystemMessageToHumanContent?: boolean,
    model?: string
): Content[]
export declare function convertUsageMetadata(usageMetadata: GenerateContentResponse['usageMetadata']): UsageMetadata
export declare function mapGenerateContentResultToChatResult(
    response: EnhancedGenerateContentResponse,
    extra?: {
        usageMetadata: UsageMetadata | undefined
    }
): ChatResult
export declare function convertResponseContentToChatGenerationChunk(
    response: EnhancedGenerateContentResponse,
    extra: {
        usageMetadata?: UsageMetadata | undefined
        index: number
    }
): ChatGenerationChunk | null
export declare class ChatGoogleGenerativeAI extends LangchainChatGoogleGenerativeAI implements IVisionChatModal {
    configuredModel: string
    configuredMaxToken?: number
    multiModalOption: IMultiModalOption
    id: string
    constructor(id: string, fields: GoogleGenerativeAIChatInput)
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
    bindTools(tools: any[], kwargs?: Record<string, any>): ReturnType<LangchainChatGoogleGenerativeAI['bindTools']>
    /**
     * Override _generate to use custom response mapper that extracts inlineData
     */
    _generate(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun): Promise<ChatResult>
    /**
     * Override streaming method to use custom chunk converter that extracts inlineData
     */
    _streamResponseChunks(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        runManager?: CallbackManagerForLLMRun
    ): AsyncGenerator<ChatGenerationChunk>
    setMultiModalOption(multiModalOption: IMultiModalOption): void
}
