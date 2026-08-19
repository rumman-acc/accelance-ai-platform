import { UnstructuredLoaderOptions } from '@langchain/community/document_loaders/fs/unstructured'
import { BaseDocumentLoader } from '@langchain/classic/document_loaders/base'
import { Document } from '@langchain/core/documents'
/**
 * Represents an element returned by the Unstructured API. It has
 * properties for the element type, text content, and metadata.
 */
type Element = {
    type: string
    text: string
    metadata: {
        [key: string]: unknown
    }
}
export declare class UnstructuredLoader extends BaseDocumentLoader {
    private apiUrl
    private apiKey
    private strategy
    private encoding?
    private ocrLanguages
    private coordinates?
    private pdfInferTableStructure?
    private xmlKeepTags?
    private skipInferTableTypes?
    private hiResModelName?
    private includePageBreaks?
    private chunkingStrategy?
    private multiPageSections?
    private combineUnderNChars?
    private newAfterNChars?
    private maxCharacters?
    constructor(optionsOrLegacyFilePath: UnstructuredLoaderOptions)
    _partition(buffer: Buffer, fileName: string): Promise<Element[]>
    loadAndSplitBuffer(buffer: Buffer, fileName: string): Promise<Document[]>
    load(): Promise<Document[]>
}
export {}
