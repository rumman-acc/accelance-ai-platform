"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkspaceShared1726654922034 = void 0;
class AddWorkspaceShared1726654922034 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`workspace_shared\` (
                \`id\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`sharedItemId\` varchar(50) NOT NULL,
                \`itemType\` varchar(50) NOT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE workspace_shared`);
    }
}
exports.AddWorkspaceShared1726654922034 = AddWorkspaceShared1726654922034;
//# sourceMappingURL=1726654922034-AddWorkspaceShared.js.map