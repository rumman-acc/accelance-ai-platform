import { VectorStore } from '@langchain/core/vectorstores'
import { ICommonObject, INodeData } from '../../../../src'
import { Document } from '@langchain/core/documents'
import { Embeddings } from '@langchain/core/embeddings'
export declare abstract class VectorStoreDriver {
    protected nodeData: INodeData
    protected options: ICommonObject
    constructor(nodeData: INodeData, options: ICommonObject)
    abstract instanciate(metaDataFilters?: any): Promise<VectorStore>
    abstract fromDocuments(documents: Document[]): Promise<VectorStore>
    protected adaptInstance(instance: VectorStore, _metaDataFilters?: any): Promise<VectorStore>
    getHost(): string
    getPort(): number
    getSSL(): boolean
    getDatabase(): string
    getTableName(): string
    getSchemaName(): string | undefined
    getTablePath(): string
    getEmbeddings(): Embeddings
    sanitizeTableName(tableName: string): string
    getCredentials(): Promise<{
        user: any
        password: any
    }>
}
