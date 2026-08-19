import { Dataset } from '../../database/entities/Dataset';
import { DatasetRow } from '../../database/entities/DatasetRow';
declare const _default: {
    getAllDatasets: (workspaceId: string, page?: number, limit?: number) => Promise<Dataset[] | {
        total: number;
        data: Dataset[];
    }>;
    getDataset: (id: string, workspaceId: string, page?: number, limit?: number) => Promise<{
        rows: DatasetRow[];
        total: number;
        id: string;
        name: string;
        description: string;
        createdDate: Date;
        updatedDate: Date;
        workspaceId: string;
    }>;
    createDataset: (body: any, workspaceId: string) => Promise<Dataset>;
    updateDataset: (id: string, body: any, workspaceId: string) => Promise<Dataset>;
    deleteDataset: (id: string, workspaceId: string) => Promise<import("typeorm").DeleteResult>;
    addDatasetRow: (body: any) => Promise<DatasetRow | {
        message: string;
    }>;
    updateDatasetRow: (id: string, body: any) => Promise<DatasetRow>;
    deleteDatasetRow: (id: string, workspaceId: string) => Promise<import("typeorm").DeleteResult>;
    patchDeleteRows: (ids: string[] | undefined, workspaceId: string) => Promise<import("typeorm").DeleteResult>;
    reorderDatasetRow: (datasetId: string, rows: any[], workspaceId: string) => Promise<{
        message: string;
    }>;
};
export default _default;
