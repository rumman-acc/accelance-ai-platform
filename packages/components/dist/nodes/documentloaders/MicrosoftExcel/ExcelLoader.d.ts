import { Document } from '@langchain/core/documents'
import { BufferLoader } from '@langchain/classic/document_loaders/fs/buffer'
/**
 * Document loader that uses SheetJS to load documents.
 *
 * Each worksheet is parsed into an array of row objects using the SheetJS
 * `sheet_to_json` method and projected to a `Document`. Metadata includes
 * original sheet name, row data, and row index
 */
export declare class LoadOfSheet extends BufferLoader {
    attributes: {
        name: string
        description: string
        type: string
    }[]
    constructor(filePathOrBlob: string | Blob)
    /**
     * Parse document
     *
     * NOTE: column labels in multiple sheets are not disambiguated!
     *
     * @param raw Raw data Buffer
     * @param metadata Document metadata
     * @returns Array of Documents
     */
    parse(raw: Buffer, metadata: Document['metadata']): Promise<Document[]>
}
