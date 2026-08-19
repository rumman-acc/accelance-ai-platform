"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../../src/utils");
const pgSaver_1 = require("./pgSaver");
const sanitizeDataSourceOptions_1 = require("../../../../src/sanitizeDataSourceOptions");
class PostgresAgentMemory_Memory {
    constructor() {
        this.label = 'Postgres Agent Memory';
        this.name = 'postgresAgentMemory';
        this.version = 1.0;
        this.type = 'AgentMemory';
        this.icon = 'postgres.svg';
        this.category = 'Memory';
        this.description = 'Memory for agentflow to remember the state of the conversation using Postgres database';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(pgSaver_1.PostgresSaver)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['PostgresApi'],
            optional: true
        };
        this.inputs = [
            {
                label: 'Host',
                name: 'host',
                type: 'string'
            },
            {
                label: 'Database',
                name: 'database',
                type: 'string'
            },
            {
                label: 'Port',
                name: 'port',
                type: 'number',
                default: '5432'
            },
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
        let datasourceOptions = {
            ...additionalConfiguration,
            type: 'postgres'
        };
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const user = (0, utils_1.getCredentialParam)('user', credentialData, nodeData);
        const password = (0, utils_1.getCredentialParam)('password', credentialData, nodeData);
        const _port = nodeData.inputs?.port || '5432';
        const port = parseInt(_port);
        datasourceOptions = {
            ...datasourceOptions,
            host: nodeData.inputs?.host,
            port,
            database: nodeData.inputs?.database,
            username: user,
            user: user,
            password: password
        };
        const args = {
            datasourceOptions,
            threadId,
            appDataSource,
            databaseEntities,
            chatflowid,
            orgId
        };
        const recordManager = new pgSaver_1.PostgresSaver(args);
        return recordManager;
    }
}
module.exports = { nodeClass: PostgresAgentMemory_Memory };
//# sourceMappingURL=PostgresAgentMemory.js.map