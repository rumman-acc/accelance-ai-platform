'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const typeorm_1 = require('typeorm')
const utils_2 = require('../../vectorstores/Postgres/utils')
const utils_3 = require('./utils')
const sanitizeDataSourceOptions_1 = require('../../../src/sanitizeDataSourceOptions')
const recordManagerSecurity_1 = require('../../../src/recordManagerSecurity')
const serverCredentialsExists = !!process.env.POSTGRES_RECORDMANAGER_USER && !!process.env.POSTGRES_RECORDMANAGER_PASSWORD
class PostgresRecordManager_RecordManager {
    constructor() {
        this.label = 'Postgres Record Manager'
        this.name = 'postgresRecordManager'
        this.version = 1.0
        this.type = 'Postgres RecordManager'
        this.icon = 'postgres.svg'
        this.category = 'Record Manager'
        this.description = 'Use Postgres to keep track of document writes into the vector databases'
        this.baseClasses = [this.type, 'RecordManager', ...(0, utils_1.getBaseClasses)(PostgresRecordManager)]
        this.inputs = [
            {
                label: 'Host',
                name: 'host',
                type: 'string',
                placeholder: (0, utils_2.getHost)(),
                optional: !!(0, utils_2.getHost)()
            },
            {
                label: 'Database',
                name: 'database',
                type: 'string',
                placeholder: (0, utils_3.getDatabase)(),
                optional: !!(0, utils_3.getDatabase)()
            },
            {
                label: 'Port',
                name: 'port',
                type: 'number',
                placeholder: (0, utils_3.getPort)(),
                optional: true
            },
            {
                label: 'SSL',
                name: 'ssl',
                description: 'Use SSL to connect to Postgres',
                type: 'boolean',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Additional Connection Configuration',
                name: 'additionalConfig',
                type: 'json',
                description:
                    'Optional TypeORM connection options (e.g. ssl, connectTimeout). entities, subscribers, migrations, and extra are not allowed.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Table Name',
                name: 'tableName',
                type: 'string',
                placeholder: (0, utils_3.getTableName)(),
                additionalParams: true,
                optional: true
            },
            {
                label: 'Namespace',
                name: 'namespace',
                type: 'string',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Cleanup',
                name: 'cleanup',
                type: 'options',
                description:
                    'Read more on the difference between different cleanup methods <a target="_blank" href="https://js.langchain.com/docs/modules/data_connection/indexing/#deletion-modes">here</a>',
                options: [
                    {
                        label: 'None',
                        name: 'none',
                        description: 'No clean up of old content'
                    },
                    {
                        label: 'Incremental',
                        name: 'incremental',
                        description:
                            'Delete previous versions of the content if content of the source document has changed. Important!! SourceId Key must be specified and document metadata must contains the specified key'
                    },
                    {
                        label: 'Full',
                        name: 'full',
                        description:
                            'Same as incremental, but if the source document has been deleted, it will be deleted from vector store as well, incremental mode will not.'
                    }
                ],
                additionalParams: true,
                default: 'none'
            },
            {
                label: 'SourceId Key',
                name: 'sourceIdKey',
                type: 'string',
                description:
                    'Key used to get the true source of document, to be compared against the record. Document metadata must contains SourceId Key',
                default: 'source',
                placeholder: 'source',
                additionalParams: true,
                optional: true
            }
        ]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['PostgresApi'],
            optional: serverCredentialsExists
        }
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
        const user = (0, utils_1.getCredentialParam)('user', credentialData, nodeData, process.env.POSTGRES_RECORDMANAGER_USER)
        const password = (0, utils_1.getCredentialParam)('password', credentialData, nodeData, process.env.POSTGRES_RECORDMANAGER_PASSWORD)
        const tableName = (0, recordManagerSecurity_1.sanitizeRecordManagerTableName)((0, utils_3.getTableName)(nodeData))
        const additionalConfig = nodeData.inputs?.additionalConfig
        const _namespace = nodeData.inputs?.namespace
        const namespace = _namespace ? (0, recordManagerSecurity_1.sanitizeRecordManagerNamespace)(_namespace) : options.chatflowid
        const cleanup = nodeData.inputs?.cleanup
        const _sourceIdKey = nodeData.inputs?.sourceIdKey
        const sourceIdKey = _sourceIdKey ? _sourceIdKey : 'source'
        let additionalConfiguration = {}
        if (additionalConfig) {
            try {
                additionalConfiguration = typeof additionalConfig === 'object' ? additionalConfig : JSON.parse(additionalConfig)
            } catch (exception) {
                throw new Error('Invalid JSON in the Additional Configuration: ' + exception)
            }
            additionalConfiguration = (0, sanitizeDataSourceOptions_1.sanitizeDataSourceOptions)(additionalConfiguration)
        }
        const postgresConnectionOptions = (0, sanitizeDataSourceOptions_1.mergeDataSourceOptions)(
            {
                type: 'postgres',
                host: (0, utils_2.getHost)(nodeData),
                port: (0, utils_3.getPort)(nodeData),
                ssl: (0, utils_2.getSSL)(nodeData),
                username: user,
                password: password,
                database: (0, utils_3.getDatabase)(nodeData)
            },
            additionalConfiguration
        )
        const args = {
            postgresConnectionOptions: postgresConnectionOptions,
            tableName: tableName
        }
        const recordManager = new PostgresRecordManager(namespace, args)
        recordManager.cleanup = cleanup
        recordManager.sourceIdKey = sourceIdKey
        return recordManager
    }
}
class PostgresRecordManager {
    constructor(namespace, config) {
        this.lc_namespace = ['langchain', 'recordmanagers', 'postgres']
        const { tableName } = config
        this.namespace = namespace
        this.tableName = tableName
        this.config = config
    }
    sanitizeTableName(tableName) {
        return (0, recordManagerSecurity_1.sanitizeRecordManagerTableName)(tableName)
    }
    async getDataSource() {
        const { postgresConnectionOptions } = this.config
        if (!postgresConnectionOptions) {
            throw new Error('No datasource options provided')
        }
        // Prevent using default MySQL port, otherwise will throw uncaught error and crashing the app
        if (postgresConnectionOptions.port === 3006) {
            throw new Error('Invalid port number')
        }
        const dataSource = new typeorm_1.DataSource(postgresConnectionOptions)
        await dataSource.initialize()
        return dataSource
    }
    async createSchema() {
        const dataSource = await this.getDataSource()
        try {
            const queryRunner = dataSource.createQueryRunner()
            const tableName = this.sanitizeTableName(this.tableName)
            await queryRunner.manager.query(`
  CREATE TABLE IF NOT EXISTS "${tableName}" (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    namespace TEXT NOT NULL,
    updated_at Double PRECISION NOT NULL,
    group_id TEXT,
    UNIQUE (key, namespace)
  );
  CREATE INDEX IF NOT EXISTS updated_at_index ON "${tableName}" (updated_at);
  CREATE INDEX IF NOT EXISTS key_index ON "${tableName}" (key);
  CREATE INDEX IF NOT EXISTS namespace_index ON "${tableName}" (namespace);
  CREATE INDEX IF NOT EXISTS group_id_index ON "${tableName}" (group_id);`)
            // Add doc_id column if it doesn't exist (migration for existing tables)
            await queryRunner.manager.query(`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = '${tableName}' AND column_name = 'doc_id'
    ) THEN
      ALTER TABLE "${tableName}" ADD COLUMN doc_id TEXT;
      CREATE INDEX IF NOT EXISTS doc_id_index ON "${tableName}" (doc_id);
    END IF;
  END $$;`)
            await queryRunner.release()
        } catch (e) {
            // This error indicates that the table already exists
            // Due to asynchronous nature of the code, it is possible that
            // the table is created between the time we check if it exists
            // and the time we try to create it. It can be safely ignored.
            if ('code' in e && e.code === '23505') {
                return
            }
            throw e
        } finally {
            await dataSource.destroy()
        }
    }
    async getTime() {
        const dataSource = await this.getDataSource()
        try {
            const queryRunner = dataSource.createQueryRunner()
            const res = await queryRunner.manager.query('SELECT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AS extract')
            await queryRunner.release()
            return Number.parseFloat(res[0].extract)
        } catch (error) {
            console.error('Error getting time in PostgresRecordManager:')
            throw error
        } finally {
            await dataSource.destroy()
        }
    }
    /**
     * Generates the SQL placeholders for a specific row at the provided index.
     *
     * @param index - The index of the row for which placeholders need to be generated.
     * @param numOfColumns - The number of columns we are inserting data into.
     * @returns The SQL placeholders for the row values.
     */
    generatePlaceholderForRowAt(index, numOfColumns) {
        const placeholders = []
        for (let i = 0; i < numOfColumns; i += 1) {
            placeholders.push(`$${index * numOfColumns + i + 1}`)
        }
        return `(${placeholders.join(', ')})`
    }
    async update(keys, updateOptions) {
        if (keys.length === 0) {
            return
        }
        const dataSource = await this.getDataSource()
        const queryRunner = dataSource.createQueryRunner()
        const tableName = this.sanitizeTableName(this.tableName)
        const updatedAt = await this.getTime()
        const { timeAtLeast, groupIds: _groupIds } = updateOptions ?? {}
        if (timeAtLeast && updatedAt < timeAtLeast) {
            throw new Error(`Time sync issue with database ${updatedAt} < ${timeAtLeast}`)
        }
        // Handle both new format (objects with uid and docId) and old format (strings)
        const isNewFormat = keys.length > 0 && typeof keys[0] === 'object' && 'uid' in keys[0]
        const keyStrings = isNewFormat ? keys.map((k) => k.uid) : keys
        const docIds = isNewFormat ? keys.map((k) => k.docId) : keys.map(() => null)
        const groupIds = _groupIds ?? keyStrings.map(() => null)
        if (groupIds.length !== keyStrings.length) {
            throw new Error(`Number of keys (${keyStrings.length}) does not match number of group_ids ${groupIds.length})`)
        }
        const recordsToUpsert = keyStrings.map((key, i) => [key, this.namespace, updatedAt, groupIds[i], docIds[i]])
        const valuesPlaceholders = recordsToUpsert.map((_, j) => this.generatePlaceholderForRowAt(j, recordsToUpsert[0].length)).join(', ')
        const query = `INSERT INTO "${tableName}" (key, namespace, updated_at, group_id, doc_id) VALUES ${valuesPlaceholders} ON CONFLICT (key, namespace) DO UPDATE SET updated_at = EXCLUDED.updated_at, doc_id = EXCLUDED.doc_id;`
        try {
            await queryRunner.manager.query(query, recordsToUpsert.flat())
            await queryRunner.release()
        } catch (error) {
            console.error('Error updating in PostgresRecordManager:')
            throw error
        } finally {
            await dataSource.destroy()
        }
    }
    async exists(keys) {
        if (keys.length === 0) {
            return []
        }
        const dataSource = await this.getDataSource()
        const queryRunner = dataSource.createQueryRunner()
        const tableName = this.sanitizeTableName(this.tableName)
        const startIndex = 2
        const arrayPlaceholders = keys.map((_, i) => `$${i + startIndex}`).join(', ')
        const query = `
        SELECT k, (key is not null) ex from unnest(ARRAY[${arrayPlaceholders}]) k left join "${tableName}" on k=key and namespace = $1;
        `
        try {
            const res = await queryRunner.manager.query(query, [this.namespace, ...keys.flat()])
            await queryRunner.release()
            return res.map((row) => row.ex)
        } catch (error) {
            console.error('Error checking existence of keys in PostgresRecordManager:')
            throw error
        } finally {
            await dataSource.destroy()
        }
    }
    async listKeys(options) {
        const { before, after, limit, groupIds, docId } = options ?? {}
        const tableName = this.sanitizeTableName(this.tableName)
        let query = `SELECT key FROM "${tableName}" WHERE namespace = $1`
        const values = [this.namespace]
        let index = 2
        if (before) {
            values.push(before)
            query += ` AND updated_at < $${index}`
            index += 1
        }
        if (after) {
            values.push(after)
            query += ` AND updated_at > $${index}`
            index += 1
        }
        if (limit) {
            values.push(limit)
            query += ` LIMIT $${index}`
            index += 1
        }
        if (groupIds) {
            values.push(groupIds)
            query += ` AND group_id = ANY($${index})`
            index += 1
        }
        if (docId) {
            values.push(docId)
            query += ` AND doc_id = $${index}`
            index += 1
        }
        query += ';'
        const dataSource = await this.getDataSource()
        const queryRunner = dataSource.createQueryRunner()
        try {
            const res = await queryRunner.manager.query(query, values)
            await queryRunner.release()
            return res.map((row) => row.key)
        } catch (error) {
            console.error('Error listing keys in PostgresRecordManager:')
            throw error
        } finally {
            await dataSource.destroy()
        }
    }
    async deleteKeys(keys) {
        if (keys.length === 0) {
            return
        }
        const dataSource = await this.getDataSource()
        const queryRunner = dataSource.createQueryRunner()
        const tableName = this.sanitizeTableName(this.tableName)
        try {
            const query = `DELETE FROM "${tableName}" WHERE namespace = $1 AND key = ANY($2);`
            await queryRunner.manager.query(query, [this.namespace, keys])
            await queryRunner.release()
        } catch (error) {
            console.error('Error deleting keys')
            throw error
        } finally {
            await dataSource.destroy()
        }
    }
}
module.exports = { nodeClass: PostgresRecordManager_RecordManager }
//# sourceMappingURL=PostgresRecordManager.js.map
