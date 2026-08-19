import { DataSourceOptions } from 'typeorm'
import { VectorStoreDriver } from './Base'
import { ICommonObject } from '../../../../src'
import { TypeORMVectorStore, TypeORMVectorStoreArgs, TypeORMVectorStoreDocument } from '@langchain/community/vectorstores/typeorm'
import { VectorStore } from '@langchain/core/vectorstores'
import { Document } from '@langchain/core/documents'
export declare class TypeORMDriver extends VectorStoreDriver {
    protected _postgresConnectionOptions: DataSourceOptions
    protected getPostgresConnectionOptions(): Promise<DataSourceOptions>
    getArgs(): Promise<TypeORMVectorStoreArgs>
    instanciate(metadataFilters?: any): Promise<VectorStore>
    fromDocuments(documents: Document[]): Promise<VectorStore>
    sanitizeDocuments(documents: Document[]): Document<Record<string, any>>[]
    protected adaptInstance(instance: TypeORMVectorStore, metadataFilters?: any, tablePath?: string): Promise<VectorStore>
    get computedOperatorString(): '<=>' | '<#>' | '<->'
    /**
     * Ensures the table exists in the database with the correct schema.
     * Creates the pgvector extension and table if they don't exist.
     */
    ensureTableInDatabase(instance: TypeORMVectorStore, tablePath: string): Promise<void>
    static similaritySearchVectorWithScore: (
        query: number[],
        k: number,
        tablePath: string,
        postgresConnectionOptions: ICommonObject,
        filter?: any,
        distanceOperator?: string
    ) => Promise<[TypeORMVectorStoreDocument, number][]>
}
