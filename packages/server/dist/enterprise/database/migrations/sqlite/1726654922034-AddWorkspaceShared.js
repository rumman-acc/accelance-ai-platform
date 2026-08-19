"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkspaceShared1726654922034 = void 0;
class AddWorkspaceShared1726654922034 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "workspace_shared" (
                "id" varchar PRIMARY KEY NOT NULL, 
                "workspaceId" varchar NOT NULL, 
                "sharedItemId" varchar NOT NULL, 
                "itemType" varchar NOT NULL, 
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE workspace_shared`);
    }
}
exports.AddWorkspaceShared1726654922034 = AddWorkspaceShared1726654922034;
//# sourceMappingURL=1726654922034-AddWorkspaceShared.js.map