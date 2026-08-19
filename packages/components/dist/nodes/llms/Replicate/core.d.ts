import { LLM, type BaseLLMParams } from '@langchain/core/language_models/llms';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import { GenerationChunk } from '@langchain/core/outputs';
import type ReplicateInstance from 'replicate';
export interface ReplicateInput {
    model: `${string}/${string}` | `${string}/${string}:${string}`;
    input?: {
        [key: string]: string | number | boolean;
    };
    apiKey?: string;
    promptKey?: string;
}
export declare class Replicate extends LLM implements ReplicateInput {
    lc_serializable: boolean;
    model: ReplicateInput['model'];
    input: ReplicateInput['input'];
    apiKey: string;
    promptKey?: string;
    constructor(fields: ReplicateInput & BaseLLMParams);
    _llmType(): string;
    /** @ignore */
    _call(prompt: string, options: this['ParsedCallOptions']): Promise<string>;
    _streamResponseChunks(prompt: string, options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun): AsyncGenerator<GenerationChunk>;
    /** @ignore */
    static imports(): Promise<{
        Replicate: typeof ReplicateInstance;
    }>;
    private _prepareReplicate;
    private _getReplicateInput;
}
