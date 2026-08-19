import { ICommonObject } from 'accelance-components';
import { Evaluation } from '../../database/entities/Evaluation';
import { EvaluationRun } from '../../database/entities/EvaluationRun';
import { IEvaluationResult } from '../../Interface';
declare const _default: {
    createEvaluation: (body: ICommonObject, baseURL: string, orgId: string, workspaceId: string) => Promise<IEvaluationResult[] | {
        total: number;
        data: IEvaluationResult[];
    }>;
    getAllEvaluations: (workspaceId: string, page?: number, limit?: number) => Promise<IEvaluationResult[] | {
        total: number;
        data: IEvaluationResult[];
    }>;
    deleteEvaluation: (id: string, activeWorkspaceId: string) => Promise<Evaluation[]>;
    getEvaluation: (id: string, workspaceId: string) => Promise<{
        versionCount: number;
        versionNo: number;
        rows: EvaluationRun[];
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
    }>;
    isOutdated: (id: string, workspaceId: string) => Promise<ICommonObject>;
    runAgain: (id: string, baseURL: string, orgId: string, workspaceId: string) => Promise<IEvaluationResult[] | {
        total: number;
        data: IEvaluationResult[];
    }>;
    getVersions: (id: string, workspaceId: string) => Promise<{
        versions: {
            id: string;
            runDate: Date;
            version: number;
        }[];
    }>;
    patchDeleteEvaluations: (ids: string[] | undefined, activeWorkspaceId: string, isDeleteAllVersion?: boolean) => Promise<Evaluation[]>;
};
export default _default;
