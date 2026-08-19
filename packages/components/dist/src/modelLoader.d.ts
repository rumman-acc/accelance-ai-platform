import { INodeOptionsValue } from './Interface';
export declare enum MODEL_TYPE {
    CHAT = "chat",
    LLM = "llm",
    EMBEDDING = "embedding"
}
export declare const getModelsJSONPath: () => string;
export declare const getModelConfigByModelName: (category: MODEL_TYPE, provider: string | undefined, name: string | undefined) => Promise<any>;
export declare const getModels: (category: MODEL_TYPE, name: string) => Promise<INodeOptionsValue[]>;
export declare const getRegions: (category: MODEL_TYPE, name: string) => Promise<INodeOptionsValue[]>;
