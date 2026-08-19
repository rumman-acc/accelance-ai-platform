"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionLinkWorkspaceId1746862866554 = void 0;
const mariaDbCustomFunctions_1 = require("./mariaDbCustomFunctions");
class ExecutionLinkWorkspaceId1746862866554 {
    async up(queryRunner) {
        // step 1 - add workspaceId column
        await (0, mariaDbCustomFunctions_1.ensureColumnExists)(queryRunner, 'execution', 'workspaceId', 'varchar(36)');
        // step 2 - add index and foreign key for workspaceId
        await queryRunner.query(`
            ALTER TABLE \`execution\`
            ADD INDEX \`idx_execution_workspaceId\` (\`workspaceId\`),
            ADD CONSTRAINT \`fk_execution_workspaceId\`
            FOREIGN KEY (\`workspaceId\`)
            REFERENCES \`workspace\`(\`id\`);
        `);
    }
    async down(queryRunner) {
        // step 1 - drop index and foreign key for workspaceId
        await queryRunner.query(`
            ALTER TABLE \`execution\`
            DROP INDEX \`idx_execution_workspaceId\`,
            DROP FOREIGN KEY \`fk_execution_workspaceId\`;
        `);
        // step 2 - drop workspaceId column
        await queryRunner.query(`ALTER TABLE \`execution\` DROP COLUMN \`workspaceId\`;`);
    }
}
exports.ExecutionLinkWorkspaceId1746862866554 = ExecutionLinkWorkspaceId1746862866554;
//# sourceMappingURL=1746862866554-ExecutionLinkWorkspaceId.js.map