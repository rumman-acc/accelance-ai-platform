import { IDocumentStoreFileChunk } from '../../Interface';
export declare class DocumentStoreFileChunk implements IDocumentStoreFileChunk {
    id: string;
    docId: string;
    storeId: string;
    chunkNo: number;
    pageContent: string;
    metadata: string;
}
