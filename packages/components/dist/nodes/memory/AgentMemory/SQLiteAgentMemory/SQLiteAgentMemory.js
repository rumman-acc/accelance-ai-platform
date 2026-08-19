"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const utils_1 = require("../../../../src/utils");
const sqliteSaver_1 = require("./sqliteSaver");
const sanitizeDataSourceOptions_1 = require("../../../../src/sanitizeDataSourceOptions");
const validator_1 = require("../../../../src/validator");
class SQLiteAgentMemory_Memory {
    constructor() {
        this.label = 'SQLite Agent Memory';
        this.name = 'sqliteAgentMemory';
        this.version = 1.0;
        this.type = 'SQLiteAgentMemory';
        this.icon = 'sqlite.png';
        this.category = 'Memory';
        this.description = 'Memory for agentflow to remember the state of the conversation using SQLite database';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(sqliteSaver_1.SqliteSaver)];
        this.inputs = [
            /*{
                label: 'Database File Path',
                name: 'databaseFilePath',
                type: 'string',
                placeholder: 'C:\\Users\\User\\.flowise\\database.sqlite',
                description: 'Path to the SQLite database file. Leave empty to use default application database',
                optional: true
            },*/
            {
                label: 'Additional Connection Configuration',
                name: 'additionalConfig',
                type: 'json',
                description: 'Optional TypeORM connection options (e.g. ssl, connectTimeout). entities, subscribers, migrations, and extra are not allowed.',
                additionalParams: true,
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const additionalConfig = nodeData.inputs?.additionalConfig;
        const databaseEntities = options.databaseEntities;
        const chatflowid = options.chatflowid;
        const appDataSource = options.appDataSource;
        const orgId = options.orgId;
        let additionalConfiguration = {};
        if (additionalConfig) {
            try {
                additionalConfiguration = typeof additionalConfig === 'object' ? additionalConfig : JSON.parse(additionalConfig);
            }
            catch (exception) {
                throw new Error('Invalid JSON in the Additional Configuration: ' + exception);
            }
            additionalConfiguration = (0, sanitizeDataSourceOptions_1.sanitizeDataSourceOptions)(additionalConfiguration);
        }
        const threadId = options.sessionId || options.chatId;
        const database = (0, validator_1.validateSQLitePath)(path_1.default.join(process.env.DATABASE_PATH ?? path_1.default.join((0, utils_1.getUserHome)(), '.flowise'), 'database.sqlite'));
        const datasourceOptions = (0, sanitizeDataSourceOptions_1.mergeDataSourceOptions)({
            database,
            type: 'sqlite'
        }, additionalConfiguration);
        const args = {
            datasourceOptions,
            threadId,
            appDataSource,
            databaseEntities,
            chatflowid,
            orgId
        };
        const recordManager = new sqliteSaver_1.SqliteSaver(args);
        return recordManager;
    }
}
module.exports = { nodeClass: SQLiteAgentMemory_Memory };
//# sourceMappingURL=SQLiteAgentMemory.js.map