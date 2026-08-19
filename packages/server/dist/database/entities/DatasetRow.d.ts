import { IDatasetRow } from '../../Interface';
export declare class DatasetRow implements IDatasetRow {
    id: string;
    datasetId: string;
    input: string;
    output: string;
    updatedDate: Date;
    sequenceNo: number;
}
