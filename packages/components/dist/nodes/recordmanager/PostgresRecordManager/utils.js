"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHost = getHost;
exports.getDatabase = getDatabase;
exports.getPort = getPort;
exports.getSSL = getSSL;
exports.getTableName = getTableName;
const src_1 = require("../../../src");
function getHost(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.host, process.env.POSTGRES_RECORDMANAGER_HOST);
}
function getDatabase(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.database, process.env.POSTGRES_RECORDMANAGER_DATABASE);
}
function getPort(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.port, process.env.POSTGRES_RECORDMANAGER_PORT, '5432');
}
function getSSL(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.ssl, process.env.POSTGRES_RECORDMANAGER_SSL, false);
}
function getTableName(nodeData) {
    return (0, src_1.defaultChain)(nodeData?.inputs?.tableName, process.env.POSTGRES_RECORDMANAGER_TABLE_NAME, 'upsertion_records');
}
//# sourceMappingURL=utils.js.map