"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHost = getHost;
exports.getDatabase = getDatabase;
exports.getPort = getPort;
exports.getSSL = getSSL;
exports.getTableName = getTableName;
exports.getContentColumnName = getContentColumnName;
exports.getSchemaName = getSchemaName;
const src_1 = require("../../../src");
function getHost(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.host, process.env.POSTGRES_VECTORSTORE_HOST);
}
function getDatabase(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.database, process.env.POSTGRES_VECTORSTORE_DATABASE);
}
function getPort(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.port, process.env.POSTGRES_VECTORSTORE_PORT, '5432');
}
function getSSL(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.ssl, process.env.POSTGRES_VECTORSTORE_SSL, false);
}
function getTableName(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.tableName, process.env.POSTGRES_VECTORSTORE_TABLE_NAME, 'documents');
}
function getContentColumnName(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.contentColumnName, process.env.POSTGRES_VECTORSTORE_CONTENT_COLUMN_NAME, 'pageContent');
}
function getSchemaName(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.schemaName, process.env.POSTGRES_VECTORSTORE_SCHEMA_NAME);
}
//# sourceMappingURL=utils.js.map