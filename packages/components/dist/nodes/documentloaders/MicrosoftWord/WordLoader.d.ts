import { Document } from '@langchain/core/documents'
import { BufferLoader } from '@langchain/classic/document_loaders/fs/buffer'
/**
 * Document loader that uses officeparser to load Word documents.
 *
 * The document is parsed into a single Document with metadata including
 * document type and extracted text content.
 */
export declare class WordLoader extends BufferLoader {
    attributes: {
        name: string
        description: string
        type: string
    }[]
    constructor(filePathOrBlob: string | Blob)
    /**
     * Parse Word document
     *
     * @param raw Raw data Buffer
     * @param metadata Document metadata
     * @returns Array of Documents
     */
    parse(raw: Buffer, metadata: Document['metadata']): Promise<Document[]>
    /**
     * Split content into sections based on common patterns
     * This is a heuristic approach since officeparser returns plain text
     */
    private splitIntoSections
}
