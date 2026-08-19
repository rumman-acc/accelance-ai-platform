'use strict'
var _a
Object.defineProperty(exports, '__esModule', { value: true })
exports.TypeORMDriver = void 0
const Base_1 = require('./Base')
const src_1 = require('../../../../src')
const sanitizeDataSourceOptions_1 = require('../../../../src/sanitizeDataSourceOptions')
const typeorm_1 = require('@langchain/community/vectorstores/typeorm')
const documents_1 = require('@langchain/core/documents')
const pg_1 = require('pg')
const uuid_1 = require('uuid')
class TypeORMDriver extends Base_1.VectorStoreDriver {
    async getPostgresConnectionOptions() {
        if (!this._postgresConnectionOptions) {
            const { user, password } = await this.getCredentials()
            const additionalConfig = this.nodeData.inputs?.additionalConfig
            let additionalConfiguration = {}
            if (additionalConfig) {
                try {
                    additionalConfiguration = typeof additionalConfig === 'object' ? additionalConfig : JSON.parse(additionalConfig)
                } catch (exception) {
                    throw new Error('Invalid JSON in the Additional Configuration: ' + exception)
                }
                additionalConfiguration = (0, sanitizeDataSourceOptions_1.sanitizeDataSourceOptions)(additionalConfiguration)
            }
            this._postgresConnectionOptions = {
                ...additionalConfiguration,
                type: 'postgres',
                host: this.getHost(),
                port: this.getPort(),
                ssl: this.getSSL(),
                username: user, // Required by TypeORMVectorStore
                user: user, // Required by Pool in similaritySearchVectorWithScore
                password: password,
                database: this.getDatabase()
            }
            // Prevent using default MySQL port, otherwise will throw uncaught error and crashing the app
            if (this.getHost() === '3006') {
                throw new Error('Invalid port number')
            }
        }
        return this._postgresConnectionOptions
    }
    async getArgs() {
        return {
            postgresConnectionOptions: await this.getPostgresConnectionOptions(),
            tableName: this.getTableName(),
            schemaName: this.getSchemaName()
        }
    }
    async instanciate(metadataFilters) {
        return this.adaptInstance(
            await typeorm_1.TypeORMVectorStore.fromDataSource(this.getEmbeddings(), await this.getArgs()),
            metadataFilters,
            this.getTablePath()
        )
    }
    async fromDocuments(documents) {
        return this.adaptInstance(
            await typeorm_1.TypeORMVectorStore.fromDocuments(documents, this.getEmbeddings(), await this.getArgs()),
            undefined,
            this.getTablePath()
        )
    }
    sanitizeDocuments(documents) {
        // Remove NULL characters which triggers error on PG
        for (var i in documents) {
            documents[i].pageContent = documents[i].pageContent.replace(/\0/g, '')
        }
        return documents
    }
    async adaptInstance(instance, metadataFilters, tablePath) {
        const effectiveTablePath = tablePath ?? this.getTablePath()
        // Rewrite the method to use pg pool connection instead of the default connection
        /* Otherwise a connection error is displayed when the chain tries to execute the function
            [chain/start] [1:chain:ConversationalRetrievalQAChain] Entering Chain run with input: { "question": "what the document is about", "chat_history": [] }
            [retriever/start] [1:chain:ConversationalRetrievalQAChain > 2:retriever:VectorStoreRetriever] Entering Retriever run with input: { "query": "what the document is about" }
            [ERROR]: uncaughtException:  Illegal invocation TypeError: Illegal invocation at Socket.ref (node:net:1524:18) at Connection.ref (.../node_modules/pg/lib/connection.js:183:17) at Client.ref (.../node_modules/pg/lib/client.js:591:21) at BoundPool._pulseQueue (/node_modules/pg-pool/index.js:148:28) at .../node_modules/pg-pool/index.js:184:37 at process.processTicksAndRejections (node:internal/process/task_queues:77:11)
        */
        instance.similaritySearchVectorWithScore = async (query, k, filter) => {
            return await _a.similaritySearchVectorWithScore(
                query,
                k,
                effectiveTablePath,
                await this.getPostgresConnectionOptions(),
                filter ?? metadataFilters,
                this.computedOperatorString
            )
        }
        instance.delete = async (params) => {
            const { ids } = params
            if (ids?.length) {
                try {
                    instance.appDataSource.getRepository(instance.documentEntity).delete(ids)
                } catch (e) {
                    console.error('Failed to delete', e)
                }
            }
        }
        instance.addVectors = async (vectors, documents, documentOptions) => {
            // Sanitize documents to remove NULL characters that cause Postgres errors
            const sanitizedDocs = this.sanitizeDocuments(documents)
            const rows = vectors.map((embedding, idx) => {
                const embeddingString = `[${embedding.join(',')}]`
                const documentRow = {
                    id: documentOptions?.ids?.length ? documentOptions.ids[idx] : (0, uuid_1.v4)(),
                    pageContent: sanitizedDocs[idx].pageContent,
                    embedding: embeddingString,
                    metadata: sanitizedDocs[idx].metadata
                }
                return documentRow
            })
            const documentRepository = instance.appDataSource.getRepository(instance.documentEntity)
            const _batchSize = this.nodeData.inputs?.batchSize
            const chunkSize = _batchSize ? parseInt(_batchSize, 10) : 500
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize)
                try {
                    await documentRepository.save(chunk)
                } catch (e) {
                    console.error(e)
                    throw new Error(`Error inserting: ${chunk[0].pageContent}`)
                }
            }
        }
        instance.addDocuments = async (documents, options) => {
            const texts = documents.map(({ pageContent }) => pageContent)
            // Ensure table exists before adding documents (this will create the table if it does not exist)
            await this.ensureTableInDatabase(instance, effectiveTablePath)
            return instance.addVectors(await this.getEmbeddings().embedDocuments(texts), documents, options)
        }
        return instance
    }
    get computedOperatorString() {
        const { distanceStrategy = 'cosine' } = this.nodeData.inputs || {}
        switch (distanceStrategy) {
            case 'cosine':
                return '<=>'
            case 'innerProduct':
                return '<#>'
            case 'euclidean':
                return '<->'
            default:
                throw new Error(`Unknown distance strategy: ${distanceStrategy}`)
        }
    }
    /**
     * Ensures the table exists in the database with the correct schema.
     * Creates the pgvector extension and table if they don't exist.
     */
    async ensureTableInDatabase(instance, tablePath) {
        await instance.appDataSource.query('CREATE EXTENSION IF NOT EXISTS vector;')
        await instance.appDataSource.query(`
            CREATE TABLE IF NOT EXISTS ${tablePath} (
                "id" uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                "pageContent" text,
                metadata jsonb,
                embedding vector
            );
        `)
    }
}
exports.TypeORMDriver = TypeORMDriver
_a = TypeORMDriver
TypeORMDriver.similaritySearchVectorWithScore = async (
    query,
    k,
    tablePath,
    postgresConnectionOptions,
    filter,
    distanceOperator = '<=>'
) => {
    const embeddingString = `[${query.join(',')}]`
    let chatflowOr = ''
    const { [src_1.FLOWISE_CHATID]: chatId, ...restFilters } = filter || {}
    const _filter = JSON.stringify(restFilters || {})
    const parameters = [embeddingString, _filter, k]
    // Match chatflow uploaded file and keep filtering on other files:
    // https://github.com/FlowiseAI/Flowise/pull/3367#discussion_r1804229295
    if (chatId) {
        parameters.push({ [src_1.FLOWISE_CHATID]: chatId })
        chatflowOr = `OR metadata @> $${parameters.length}`
    }
    const queryString = `
            SELECT *, embedding ${distanceOperator} $1 as "_distance"
            FROM ${tablePath}
            WHERE ((metadata @> $2) AND NOT (metadata ? '${src_1.FLOWISE_CHATID}')) ${chatflowOr}
            ORDER BY "_distance" ASC
            LIMIT $3;`
    const pool = new pg_1.Pool(postgresConnectionOptions)
    const conn = await pool.connect()
    const documents = await conn.query(queryString, parameters)
    conn.release()
    const results = []
    for (const doc of documents.rows) {
        if (doc._distance != null && doc.pageContent != null) {
            const document = new documents_1.Document(doc)
            document.id = doc.id
            results.push([document, doc._distance])
        }
    }
    return results
}
//# sourceMappingURL=TypeORM.js.map
