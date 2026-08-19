import type { BaseChatModelParams, LangSmithParams } from '@langchain/core/language_models/chat_models';
import { type OpenAIClient, type ChatOpenAICallOptions, type OpenAIChatInput, type OpenAICoreRequestOptions, ChatOpenAICompletions } from '@langchain/openai';
type FireworksUnsupportedArgs = 'frequencyPenalty' | 'presencePenalty' | 'logitBias' | 'functions';
type FireworksUnsupportedCallOptions = 'functions' | 'function_call';
export type ChatFireworksCallOptions = Partial<Omit<ChatOpenAICallOptions, FireworksUnsupportedCallOptions>>;
export type ChatFireworksParams = Partial<Omit<OpenAIChatInput, 'openAIApiKey' | FireworksUnsupportedArgs>> & BaseChatModelParams & {
    /**
     * Prefer `apiKey`
     */
    fireworksApiKey?: string;
    /**
     * The Fireworks API key to use.
     */
    apiKey?: string;
};
export declare class ChatFireworks extends ChatOpenAICompletions<ChatFireworksCallOptions> {
    static lc_name(): string;
    _llmType(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    lc_serializable: boolean;
    fireworksApiKey?: string;
    apiKey?: string;
    constructor(fields?: ChatFireworksParams);
    getLsParams(options: any): LangSmithParams;
    toJSON(): import("@langchain/core/load/serializable").Serialized;
    completionWithRetry(request: OpenAIClient.Chat.ChatCompletionCreateParamsStreaming, options?: OpenAICoreRequestOptions): Promise<AsyncIterable<OpenAIClient.Chat.Completions.ChatCompletionChunk>>;
    completionWithRetry(request: OpenAIClient.Chat.ChatCompletionCreateParamsNonStreaming, options?: OpenAICoreRequestOptions): Promise<OpenAIClient.Chat.Completions.ChatCompletion>;
}
export {};
