import { Callbacks } from '@langchain/core/callbacks/manager';
import { Document } from '@langchain/core/documents';
import { BaseDocumentCompressor } from '@langchain/classic/retrievers/document_compressors';
export declare class JinaRerank extends BaseDocumentCompressor {
    private jinaAPIKey;
    private readonly JINA_RERANK_API_URL;
    private model;
    private readonly topN;
    constructor(jinaAPIKey: string, model: string, topN: number);
    compressDocuments(documents: Document<Record<string, any>>[], query: string, _?: Callbacks | undefined): Promise<Document<Record<string, any>>[]>;
}
