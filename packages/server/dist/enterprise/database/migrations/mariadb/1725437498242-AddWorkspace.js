"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkspace1725437498242 = void 0;
const mariaDbCustomFunctions_1 = require("./mariaDbCustomFunctions");
class AddWorkspace1725437498242 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`workspace\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text DEFAULT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`workspace_users\` (
                 \`id\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`userId\` varchar(36) NOT NULL,
                \`role\` varchar(255) DEFAULT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;`);
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'chat_flow', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'tool', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'assistant', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'credential', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'document_store', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'evaluation', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'evaluator', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'dataset', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'apikey', 'workspaceId', 'varchar(36)');
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'variable', 'workspaceId', 'varchar(36)');
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE workspace`);
        await queryRunner.query(`DROP TABLE workspace_users`);
        await queryRunner.query(`ALTER TABLE \`chat_message\` DROP COLUMN \`workspaceId\`;`);
        await queryRunner.query(`ALTER TABLE \`tool\` DROP COLUMN \`workspaceId\`;`);
        await queryRunner.query(`ALTER TABLE \`assistant\` DROP COLUMN \`workspaceId\`;`);
        await queryRunner.query(`ALTER TABLE \`credential\` DROP COLUMN \`workspaceId\`;`);
        await queryRunner.query(`ALTER TABLE \`document_store\` DROP COLUMN \`workspaceId\`;`);
        await queryRunner.query(`ALTER TABLE \`evaluation\` DROP COLUMN \`workspaceId\`;`);
        await queryRunner.query(`ALTER TABLE \`dataset\` DROP COLUMN \`workspaceId\`;`);
        await queryRunner.query(`ALTER TABLE \`apikey\` DROP COLUMN \`workspaceId\`;`);
        await queryRunner.query(`ALTER TABLE \`variable\` DROP COLUMN \`workspaceId\`;`);
    }
}
exports.AddWorkspace1725437498242 = AddWorkspace1725437498242;
//# sourceMappingURL=1725437498242-AddWorkspace.js.map