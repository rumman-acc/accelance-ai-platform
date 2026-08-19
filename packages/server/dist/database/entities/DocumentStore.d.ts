import { DocumentStoreStatus, IDocumentStore } from '../../Interface';
export declare class DocumentStore implements IDocumentStore {
    id: string;
    name: string;
    description: string;
    loaders: string;
    whereUsed: string;
    createdDate: Date;
    updatedDate: Date;
    status: DocumentStoreStatus;
    vectorStoreConfig: string | null;
    embeddingConfig: string | null;
    recordManagerConfig: string | null;
    workspaceId: string;
}
