import { ICommonObject } from 'accelance-components';
export declare const runAdditionalEvaluators: (metricsArray: ICommonObject[], actualOutputArray: string[], errorArray: string[], selectedEvaluators: string[], workspaceId: string) => Promise<{
    results: any[];
    evaluatorMetrics: {
        passCount: number;
        failCount: number;
        errorCount: number;
    };
}>;
