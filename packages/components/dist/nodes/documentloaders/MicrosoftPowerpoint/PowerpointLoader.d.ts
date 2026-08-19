import { Document } from '@langchain/core/documents'
import { BufferLoader } from '@langchain/classic/document_loaders/fs/buffer'
/**
 * Document loader that uses officeparser to load PowerPoint documents.
 *
 * Each slide is parsed into a separate Document with metadata including
 * slide number and extracted text content.
 */
export declare class PowerpointLoader extends BufferLoader {
    attributes: {
        name: string
        description: string
        type: string
    }[]
    constructor(filePathOrBlob: string | Blob)
    /**
     * Parse PowerPoint document
     *
     * @param raw Raw data Buffer
     * @param metadata Document metadata
     * @returns Array of Documents
     */
    parse(raw: Buffer, metadata: Document['metadata']): Promise<Document[]>
    /**
     * Split content into slides based on common patterns
     * This is a heuristic approach since officeparser returns plain text
     */
    private splitIntoSlides
}
