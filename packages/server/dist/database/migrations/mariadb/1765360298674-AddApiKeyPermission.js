"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddApiKeyPermission1765360298674 = void 0;
const database_util_1 = require("../../../utils/database.util");
const logger_1 = __importDefault(require("../../../utils/logger"));
class AddApiKeyPermission1765360298674 {
    async up(queryRunner) {
        const tableName = 'apikey';
        const columnName = 'permissions';
        const columnExists = await (0, database_util_1.hasColumn)(queryRunner, tableName, columnName);
        if (!columnExists) {
            await queryRunner.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` JSON NOT NULL DEFAULT (JSON_ARRAY());`);
            const permission = '["chatflows:view","chatflows:create","chatflows:update","chatflows:duplicate","chatflows:delete","chatflows:export","chatflows:import","chatflows:config","chatflows:domains","agentflows:view","agentflows:create","agentflows:update","agentflows:duplicate","agentflows:delete","agentflows:export","agentflows:import","agentflows:config","agentflows:domains","tools:view","tools:create","tools:update","tools:delete","tools:export","assistants:view","assistants:create","assistants:update","assistants:delete","credentials:view","credentials:create","credentials:update","credentials:delete","variables:view","variables:create","variables:update","variables:delete","apikeys:view","apikeys:create","apikeys:update","apikeys:delete","documentStores:view","documentStores:create","documentStores:update","documentStores:delete","documentStores:add-loader","documentStores:delete-loader","documentStores:preview-process","documentStores:upsert-config","executions:view","executions:delete","templates:marketplace","templates:custom","templates:custom-delete","templates:toolexport","templates:flowexport"]';
            await queryRunner.query(`UPDATE \`${tableName}\` SET \`${columnName}\` = '${permission}';`);
        }
        const sso = 'sso:manage';
        const apikey = 'apikeys:import';
        const itemsToRemove = [sso, apikey];
        const roles = await queryRunner.query(`SELECT * FROM \`role\` WHERE \`${columnName}\` LIKE '%${sso}%' OR \`${columnName}\` LIKE '%${apikey}%';`);
        if (roles.length > 0) {
            for (const role of roles) {
                let permissions = [];
                try {
                    permissions = JSON.parse(role.permissions);
                }
                catch (error) {
                    logger_1.default.error(`AddApiKeyPermission1765360298674 error parsing permissions for role ${role.id}:`, error);
                    continue;
                }
                permissions = permissions.filter((permission) => !itemsToRemove.includes(permission));
                await queryRunner.query(`UPDATE \`role\` SET \`${columnName}\` = '${JSON.stringify(permissions)}' WHERE \`id\` = '${role.id}';`);
            }
        }
    }
    async down() { }
}
exports.AddApiKeyPermission1765360298674 = AddApiKeyPermission1765360298674;
//# sourceMappingURL=1765360298674-AddApiKeyPermission.js.map