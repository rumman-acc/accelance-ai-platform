import { ICommonObject } from '../src';
export declare class EvaluationRunner {
    static metrics: Map<string, string[]>;
    static getCostMetrics: (selectedProvider: string, selectedModel: string) => Promise<any>;
    static getAndDeleteMetrics(id: string): Promise<string[] | undefined>;
    static addMetrics(id: string, metric: string): void;
    baseURL: string;
    constructor(baseURL: string);
    getChatflowApiKey(chatflowId: string, apiKeys?: {
        chatflowId: string;
        apiKey: string;
    }[]): string;
    runEvaluations(data: ICommonObject): Promise<ICommonObject>;
    evaluateChatflow(chatflowId: string, apiKey: string, data: any, returnData: any): Promise<any>;
}
