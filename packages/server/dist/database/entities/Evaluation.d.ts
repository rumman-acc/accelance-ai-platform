import { IEvaluation } from '../../Interface';
export declare class Evaluation implements IEvaluation {
    id: string;
    average_metrics: string;
    additionalConfig: string;
    name: string;
    evaluationType: string;
    chatflowId: string;
    chatflowName: string;
    datasetId: string;
    datasetName: string;
    status: string;
    runDate: Date;
    workspaceId: string;
}
