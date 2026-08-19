"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreDriver = void 0;
const src_1 = require("../../../../src");
const utils_1 = require("../utils");
class VectorStoreDriver {
    constructor(nodeData, options) {
        this.nodeData = nodeData;
        this.options = options;
    }
    async adaptInstance(instance, _metaDataFilters) {
        return instance;
    }
    getHost() {
        return (0, utils_1.getHost)(this.nodeData);
    }
    getPort() {
        return (0, utils_1.getPort)(this.nodeData);
    }
    getSSL() {
        return (0, utils_1.getSSL)(this.nodeData);
    }
    getDatabase() {
        return (0, utils_1.getDatabase)(this.nodeData);
    }
    getTableName() {
        return this.sanitizeTableName((0, utils_1.getTableName)(this.nodeData));
    }
    getSchemaName() {
        const schemaName = (0, utils_1.getSchemaName)(this.nodeData);
        return schemaName ? this.sanitizeTableName(schemaName) : undefined;
    }
    getTablePath() {
        const schemaName = this.getSchemaName();
        const tableName = this.getTableName();
        if (!schemaName)
            return `"${tableName}"`;
        return `"${schemaName}"."${tableName}"`;
    }
    getEmbeddings() {
        return this.nodeData.inputs?.embeddings;
    }
    sanitizeTableName(tableName) {
        // Trim and normalize case, turn whitespace into underscores
        tableName = tableName.trim().toLowerCase().replace(/\s+/g, '_');
        // Validate using a regex (alphanumeric and underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name');
        }
        return tableName;
    }
    async getCredentials() {
        const credentialData = await (0, src_1.getCredentialData)(this.nodeData.credential ?? '', this.options);
        const user = (0, src_1.getCredentialParam)('user', credentialData, this.nodeData, process.env.POSTGRES_VECTORSTORE_USER);
        const password = (0, src_1.getCredentialParam)('password', credentialData, this.nodeData, process.env.POSTGRES_VECTORSTORE_PASSWORD);
        return {
            user,
            password
        };
    }
}
exports.VectorStoreDriver = VectorStoreDriver;
//# sourceMappingURL=Base.js.map