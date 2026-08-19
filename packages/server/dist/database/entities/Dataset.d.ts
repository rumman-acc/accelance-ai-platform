import { IDataset } from '../../Interface';
export declare class Dataset implements IDataset {
    id: string;
    name: string;
    description: string;
    createdDate: Date;
    updatedDate: Date;
    workspaceId: string;
}
