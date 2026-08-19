import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector';
import { Run } from '@langchain/core/tracers/base';
export declare class EvaluationRunTracer extends RunCollectorCallbackHandler {
    evaluationRunId: string;
    model: string;
    constructor(id: string);
    persistRun(run: Run): Promise<void>;
    countPromptTokens: (encoding: any, run: Run) => number;
    countCompletionTokens: (encoding: any, run: Run) => number;
    extractModelName: (run: Run) => string;
    onLLMEnd?(run: Run): void | Promise<void>;
    onRunUpdate(run: Run): Promise<void>;
}
