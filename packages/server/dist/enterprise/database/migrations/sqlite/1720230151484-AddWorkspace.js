"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkspace1720230151484 = void 0;
const sqlliteCustomFunctions_1 = require("./sqlliteCustomFunctions");
class AddWorkspace1720230151484 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "workspace" ("id" varchar PRIMARY KEY NOT NULL, 
"name" text NOT NULL, 
"description" varchar, 
"createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
"updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "workspace_users" ("id" varchar PRIMARY KEY NOT NULL,
"workspaceId" varchar NOT NULL,
"userId" varchar NOT NULL,
"role" varchar NOT NULL);`);
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'chat_flow', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'tool', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'assistant', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'credential', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'document_store', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'evaluation', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'evaluator', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'dataset', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'apikey', 'workspaceId', 'TEXT');
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'variable', 'workspaceId', 'TEXT');
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE workspace`);
        await queryRunner.query(`DROP TABLE workspace_users`);
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "tool" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "assistant" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "evaluation" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "evaluator" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "dataset" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "workspaceId";`);
        await queryRunner.query(`ALTER TABLE "variable" DROP COLUMN "workspaceId";`);
    }
}
exports.AddWorkspace1720230151484 = AddWorkspace1720230151484;
//# sourceMappingURL=1720230151484-AddWorkspace.js.map