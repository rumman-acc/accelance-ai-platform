'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
const path_1 = __importDefault(require('path'))
const utils_1 = require('../../../src/utils')
const validator_1 = require('../../../src/validator')
const sqliteSaver_1 = require('./SQLiteAgentMemory/sqliteSaver')
const pgSaver_1 = require('./PostgresAgentMemory/pgSaver')
const mysqlSaver_1 = require('./MySQLAgentMemory/mysqlSaver')
const sanitizeDataSourceOptions_1 = require('../../../src/sanitizeDataSourceOptions')
class AgentMemory_Memory {
    constructor() {
        this.label = 'Agent Memory'
        this.name = 'agentMemory'
        this.version = 2.0
        this.type = 'AgentMemory'
        this.icon = 'agentmemory.svg'
        this.category = 'Memory'
        this.description = 'Memory for agentflow to remember the state of the conversation'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(sqliteSaver_1.SqliteSaver)]
        this.badge = 'DEPRECATING'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['PostgresApi', 'MySQLApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Database',
                name: 'databaseType',
                type: 'options',
                options: [
                    {
                        label: 'SQLite',
                        name: 'sqlite'
                    },
                    {
                        label: 'PostgreSQL',
                        name: 'postgres'
                    },
                    {
                        label: 'MySQL',
                        name: 'mysql'
                    }
                ],
                default: 'sqlite'
            },
            {
                label: 'Database File Path',
                name: 'databaseFilePath',
                type: 'string',
                placeholder: 'C:\\Users\\User\\.flowise\\database.sqlite',
                description:
                    'If SQLite is selected, provide the path to the SQLite database file. Leave empty to use default application database',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Host',
                name: 'host',
                type: 'string',
                description: 'If PostgresQL/MySQL is selected, provide the host of the database',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Database',
                name: 'database',
                type: 'string',
                description: 'If PostgresQL/MySQL is selected, provide the name of the database',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Port',
                name: 'port',
                type: 'number',
                description: 'If PostgresQL/MySQL is selected, provide the port of the database',
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
            }
        ]
    }
    async init(nodeData, _, options) {
        const additionalConfig = nodeData.inputs?.additionalConfig
        const databaseFilePath = nodeData.inputs?.databaseFilePath
        const databaseType = nodeData.inputs?.databaseType
        const databaseEntities = options.databaseEntities
        const chatflowid = options.chatflowid
        const orgId = options.orgId
        const appDataSource = options.appDataSource
        let additionalConfiguration = {}
        if (additionalConfig) {
            try {
                additionalConfiguration = typeof additionalConfig === 'object' ? additionalConfig : JSON.parse(additionalConfig)
            } catch (exception) {
                throw new Error('Invalid JSON in the Additional Configuration: ' + exception)
            }
            additionalConfiguration = (0, sanitizeDataSourceOptions_1.sanitizeDataSourceOptions)(additionalConfiguration)
        }
        const threadId = options.sessionId || options.chatId
        let datasourceOptions = {
            ...additionalConfiguration,
            type: databaseType
        }
        if (databaseType === 'sqlite') {
            datasourceOptions.database = databaseFilePath
                ? (0, validator_1.validateSQLitePath)(databaseFilePath)
                : path_1.default.join(
                      process.env.DATABASE_PATH ?? path_1.default.join((0, utils_1.getUserHome)(), '.flowise'),
                      'database.sqlite'
                  )
            const args = {
                datasourceOptions,
                threadId,
                appDataSource,
                databaseEntities,
                chatflowid,
                orgId
            }
            const recordManager = new sqliteSaver_1.SqliteSaver(args)
            return recordManager
        } else if (databaseType === 'postgres') {
            const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
            const user = (0, utils_1.getCredentialParam)('user', credentialData, nodeData)
            const password = (0, utils_1.getCredentialParam)('password', credentialData, nodeData)
            const _port = nodeData.inputs?.port || '5432'
            const port = parseInt(_port)
            datasourceOptions = {
                ...datasourceOptions,
                host: nodeData.inputs?.host,
                port,
                database: nodeData.inputs?.database,
                username: user,
                user: user,
                password: password
            }
            const args = {
                datasourceOptions,
                threadId,
                appDataSource,
                databaseEntities,
                chatflowid,
                orgId
            }
            const recordManager = new pgSaver_1.PostgresSaver(args)
            return recordManager
        } else if (databaseType === 'mysql') {
            const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
            const user = (0, utils_1.getCredentialParam)('user', credentialData, nodeData)
            const password = (0, utils_1.getCredentialParam)('password', credentialData, nodeData)
            const _port = nodeData.inputs?.port || '3306'
            const port = parseInt(_port)
            datasourceOptions = {
                ...datasourceOptions,
                host: nodeData.inputs?.host,
                port,
                database: nodeData.inputs?.database,
                username: user,
                user: user,
                password: password,
                charset: 'utf8mb4'
            }
            const args = {
                datasourceOptions,
                threadId,
                appDataSource,
                databaseEntities,
                chatflowid,
                orgId
            }
            const recordManager = new mysqlSaver_1.MySQLSaver(args)
            return recordManager
        }
        return undefined
    }
}
module.exports = { nodeClass: AgentMemory_Memory }
//# sourceMappingURL=AgentMemory.js.map
