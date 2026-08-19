import { Evaluator } from './database/entities/Evaluator';
export interface IDataset {
    id: string;
    name: string;
    description: string;
    createdDate: Date;
    updatedDate: Date;
    workspaceId?: string;
}
export interface IDatasetRow {
    id: string;
    datasetId: string;
    input: string;
    output: string;
    updatedDate: Date;
    sequenceNo: number;
}
export declare enum EvaluationStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    ERROR = "error"
}
export interface IEvaluation {
    id: string;
    name: string;
    chatflowId: string;
    chatflowName: string;
    datasetId: string;
    datasetName: string;
    evaluationType: string;
    additionalConfig: string;
    average_metrics: string;
    status: string;
    runDate: Date;
    workspaceId?: string;
}
export interface IEvaluationResult extends IEvaluation {
    latestEval: boolean;
    version: number;
}
export interface IEvaluationRun {
    id: string;
    evaluationId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    metrics: string;
    runDate: Date;
    llmEvaluators?: string;
    evaluators?: string;
    errors?: string;
}
export interface IEvaluator {
    id: string;
    name: string;
    type: string;
    config: string;
    updatedDate: Date;
    createdDate: Date;
    workspaceId?: string;
}
export declare class EvaluatorDTO {
    id: string;
    name: string;
    type: string;
    measure?: string;
    operator?: string;
    value?: string;
    prompt?: string;
    evaluatorType?: string;
    outputSchema?: [];
    updatedDate: Date;
    createdDate: Date;
    static toEntity(body: any): Evaluator;
    static fromEntity(entity: Evaluator): EvaluatorDTO;
    static fromEntities(entities: Evaluator[]): EvaluatorDTO[];
}
