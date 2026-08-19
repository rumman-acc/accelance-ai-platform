"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkspaceIdToCustomTemplate1726655750383 = void 0;
class AddWorkspaceIdToCustomTemplate1726655750383 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN IF NOT EXISTS "workspaceId" varchar;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "workspaceId";`);
    }
}
exports.AddWorkspaceIdToCustomTemplate1726655750383 = AddWorkspaceIdToCustomTemplate1726655750383;
//# sourceMappingURL=1726655750383-AddWorkspaceIdToCustomTemplate.js.map