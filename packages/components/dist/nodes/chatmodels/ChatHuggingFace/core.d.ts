import { LLM, BaseLLMParams } from '@langchain/core/language_models/llms'
import { GenerationChunk } from '@langchain/core/outputs'
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
export interface HFInput {
    model: string
    temperature?: number
    maxTokens?: number
    stopSequences?: string[]
    topP?: number
    topK?: number
    frequencyPenalty?: number
    apiKey?: string
    endpointUrl?: string
    includeCredentials?: string | boolean
}
export declare class HuggingFaceInference extends LLM implements HFInput {
    get lc_secrets():
        | {
              [key: string]: string
          }
        | undefined
    model: string
    temperature: number | undefined
    stopSequences: string[] | undefined
    maxTokens: number | undefined
    topP: number | undefined
    topK: number | undefined
    frequencyPenalty: number | undefined
    apiKey: string | undefined
    endpointUrl: string | undefined
    includeCredentials: string | boolean | undefined
    constructor(fields?: Partial<HFInput> & BaseLLMParams)
    _llmType(): string
    invocationParams(options?: this['ParsedCallOptions']): any
    _streamResponseChunks(
        prompt: string,
        options: this['ParsedCallOptions'],
        runManager?: CallbackManagerForLLMRun
    ): AsyncGenerator<GenerationChunk>
    /** @ignore */
    _call(prompt: string, options: this['ParsedCallOptions']): Promise<string>
    /** @ignore */
    private _prepareHFInference
    /** @ignore */
    static imports(): Promise<{
        InferenceClient: typeof import('@huggingface/inference').InferenceClient
    }>
}
