import { Callbacks } from '@langchain/core/callbacks/manager'
import { Document } from '@langchain/core/documents'
import { BaseDocumentCompressor } from '@langchain/classic/retrievers/document_compressors'
export declare class AzureRerank extends BaseDocumentCompressor {
    private readonly azureApiKey
    private readonly azureApiUrl
    private readonly model
    private readonly k
    private readonly maxChunksPerDoc
    constructor(azureApiKey: string, azureApiUrl: string, model: string, k: number, maxChunksPerDoc: number)
    compressDocuments(
        documents: Document<Record<string, any>>[],
        query: string,
        _?: Callbacks | undefined
    ): Promise<Document<Record<string, any>>[]>
}
