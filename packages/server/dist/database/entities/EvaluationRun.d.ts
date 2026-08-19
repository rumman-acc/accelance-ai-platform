import { IEvaluationRun } from '../../Interface';
export declare class EvaluationRun implements IEvaluationRun {
    id: string;
    evaluationId: string;
    input: string;
    expectedOutput: string;
    runDate: Date;
    actualOutput: string;
    metrics: string;
    llmEvaluators: string;
    evaluators: string;
    errors: string;
}
