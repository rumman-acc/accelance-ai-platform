import { ICommonObject, INodeData } from '../src';
import { MessageContent } from '@langchain/core/messages';
export declare class EvaluationRunTracerLlama {
    evaluationRunId: string;
    static cbInit: boolean;
    static startTimes: Map<string, number>;
    static models: Map<string, string>;
    static tokenCounts: Map<string, number>;
    constructor(id: string);
    static constructCallBacks: () => void;
    private static calculateAndSetMetrics;
    static injectEvaluationMetadata(nodeData: INodeData, options: ICommonObject, callerObj: any): Promise<void>;
}
export declare function extractText(message: MessageContent): string;
